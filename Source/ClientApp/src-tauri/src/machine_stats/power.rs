//! Power and battery information collection for macOS using IOKit.

/// Power and battery usage data
#[derive(Debug, Clone, Default)]
pub struct PowerUsage {
    /// Whether a battery is installed
    pub battery_installed: bool,
    /// Current battery charge percentage (0-100)
    pub battery_percentage: Option<f32>,
    /// Whether the battery is fully charged
    pub fully_charged: bool,
    /// Whether external power is connected
    pub external_connected: bool,
    /// Whether low power mode is enabled
    pub low_power_mode: bool,
    /// Current system power consumption in watts
    pub system_power_watts: Option<f32>,
    /// Current battery power in/out in watts (negative = discharging)
    pub battery_power_watts: Option<f32>,
    /// Battery voltage in volts
    pub battery_voltage: Option<f32>,
    /// Battery current in milliamps (negative = discharging)
    pub battery_amperage: Option<i32>,
    /// Battery cycle count
    pub cycle_count: Option<i32>,
    /// Design capacity in mAh
    pub design_capacity_mah: Option<i32>,
    /// Current max capacity in mAh
    pub max_capacity_mah: Option<i32>,
    /// Battery health percentage (max_capacity / design_capacity * 100)
    pub battery_health: Option<f32>,
    /// Time remaining in minutes (-1 = calculating, 0 = unlimited/charging)
    pub time_remaining_minutes: Option<i32>,
    /// Adapter details
    pub adapter_watts: Option<i32>,
    /// Adapter voltage in volts
    pub adapter_voltage: Option<f32>,
    /// Adapter description (e.g., "pd charger")
    pub adapter_description: Option<String>,
}

#[cfg(target_os = "macos")]
mod iokit {
    use core_foundation::base::{CFTypeRef, TCFType};
    use core_foundation::boolean::CFBoolean;
    use core_foundation::dictionary::{CFDictionary, CFDictionaryRef};
    use core_foundation::number::CFNumber;
    use core_foundation::string::CFString;
    use std::ptr;

    #[allow(non_upper_case_globals)]
    const kIOMasterPortDefault: u32 = 0;

    #[link(name = "IOKit", kind = "framework")]
    extern "C" {
        fn IOServiceGetMatchingService(mainPort: u32, matching: CFDictionaryRef) -> u32;
        fn IOServiceMatching(name: *const i8) -> CFDictionaryRef;
        fn IORegistryEntryCreateCFProperties(
            entry: u32,
            properties: *mut CFDictionaryRef,
            allocator: CFTypeRef,
            options: u32,
        ) -> i32;
        fn IOObjectRelease(object: u32) -> i32;
    }

    /// Battery data from IOKit
    #[derive(Debug, Default)]
    pub struct BatteryData {
        pub battery_installed: bool,
        pub current_capacity: Option<i64>,
        pub fully_charged: bool,
        pub external_connected: bool,
        pub amperage: Option<i64>,
        pub cycle_count: Option<i64>,
        pub design_capacity: Option<i64>,
        pub nominal_charge_capacity: Option<i64>,
        pub voltage_mv: Option<i64>,
        pub time_remaining: Option<i64>,
        pub system_power_in_mw: Option<i64>,
        pub system_load_mw: Option<i64>,
        pub battery_power_mw: Option<i64>,
        pub adapter_watts: Option<i64>,
        pub adapter_voltage_mv: Option<i64>,
        pub adapter_description: Option<String>,
    }

    /// Get battery data from IOKit (much faster than spawning ioreg)
    pub fn get_battery_data() -> Option<BatteryData> {
        unsafe {
            let matching = IOServiceMatching(b"AppleSmartBattery\0".as_ptr() as *const i8);
            if matching.is_null() {
                return None;
            }

            let service = IOServiceGetMatchingService(kIOMasterPortDefault, matching);
            if service == 0 {
                return None;
            }

            let mut props: CFDictionaryRef = ptr::null();
            let result = IORegistryEntryCreateCFProperties(service, &mut props, ptr::null(), 0);

            IOObjectRelease(service);

            if result != 0 || props.is_null() {
                return None;
            }

            let props_dict = CFDictionary::<CFString, CFTypeRef>::wrap_under_create_rule(props);

            let mut data = BatteryData {
                battery_installed: true,
                ..Default::default()
            };

            // Parse top-level properties
            data.current_capacity = get_i64(&props_dict, "CurrentCapacity");
            data.fully_charged = get_bool(&props_dict, "FullyCharged").unwrap_or(false);
            data.external_connected = get_bool(&props_dict, "ExternalConnected").unwrap_or(false);
            data.amperage = get_i64(&props_dict, "Amperage");
            data.cycle_count = get_i64(&props_dict, "CycleCount");
            data.design_capacity = get_i64(&props_dict, "DesignCapacity");
            data.nominal_charge_capacity = get_i64(&props_dict, "NominalChargeCapacity");
            data.voltage_mv = get_i64(&props_dict, "AppleRawBatteryVoltage");
            data.time_remaining = get_i64(&props_dict, "TimeRemaining");

            // Parse PowerTelemetryData nested dictionary
            let telemetry_key = CFString::new("PowerTelemetryData");
            if let Some(telemetry_ptr) = props_dict.find(&telemetry_key) {
                let telemetry_dict_ref = *telemetry_ptr as CFDictionaryRef;
                let telemetry_dict =
                    CFDictionary::<CFString, CFTypeRef>::wrap_under_get_rule(telemetry_dict_ref);

                data.system_power_in_mw = get_i64(&telemetry_dict, "SystemPowerIn");
                data.system_load_mw = get_i64(&telemetry_dict, "SystemLoad");
                data.battery_power_mw = get_i64(&telemetry_dict, "BatteryPower");
            }

            // Parse AdapterDetails nested dictionary
            let adapter_key = CFString::new("AdapterDetails");
            if let Some(adapter_ptr) = props_dict.find(&adapter_key) {
                let adapter_dict_ref = *adapter_ptr as CFDictionaryRef;
                let adapter_dict =
                    CFDictionary::<CFString, CFTypeRef>::wrap_under_get_rule(adapter_dict_ref);

                data.adapter_watts = get_i64(&adapter_dict, "Watts");
                data.adapter_voltage_mv = get_i64(&adapter_dict, "AdapterVoltage");
                data.adapter_description = get_string(&adapter_dict, "Description");
            }

            Some(data)
        }
    }

    /// Get an i64 value from a CFDictionary
    fn get_i64(dict: &CFDictionary<CFString, CFTypeRef>, key: &str) -> Option<i64> {
        let cf_key = CFString::new(key);
        if let Some(value_ptr) = dict.find(&cf_key) {
            unsafe {
                let num_ref = *value_ptr as core_foundation::number::CFNumberRef;
                let num = CFNumber::wrap_under_get_rule(num_ref);
                return num.to_i64();
            }
        }
        None
    }

    /// Get a bool value from a CFDictionary
    fn get_bool(dict: &CFDictionary<CFString, CFTypeRef>, key: &str) -> Option<bool> {
        let cf_key = CFString::new(key);
        if let Some(value_ptr) = dict.find(&cf_key) {
            unsafe {
                let bool_ref = *value_ptr as core_foundation::boolean::CFBooleanRef;
                let cf_bool = CFBoolean::wrap_under_get_rule(bool_ref);
                return Some(cf_bool.into());
            }
        }
        None
    }

    /// Get a string value from a CFDictionary
    fn get_string(dict: &CFDictionary<CFString, CFTypeRef>, key: &str) -> Option<String> {
        let cf_key = CFString::new(key);
        if let Some(value_ptr) = dict.find(&cf_key) {
            unsafe {
                let str_ref = *value_ptr as core_foundation::string::CFStringRef;
                let cf_str = CFString::wrap_under_get_rule(str_ref);
                return Some(cf_str.to_string());
            }
        }
        None
    }
}

/// Cached low power mode state with optional timestamp (None = never fetched)
#[cfg(target_os = "macos")]
static LOW_POWER_MODE_CACHE: std::sync::RwLock<Option<(bool, std::time::Instant)>> =
    std::sync::RwLock::new(None);

/// Check if low power mode is enabled on macOS (cached for 5 seconds)
#[cfg(target_os = "macos")]
fn get_low_power_mode() -> bool {
    use std::process::Command;
    use std::time::{Duration, Instant};

    const CACHE_TTL: Duration = Duration::from_secs(5);

    // Check cache first
    {
        if let Ok(cache) = LOW_POWER_MODE_CACHE.read() {
            if let Some((value, timestamp)) = *cache {
                if timestamp.elapsed() < CACHE_TTL {
                    return value;
                }
            }
        }
    }

    // Cache expired or never fetched, fetch fresh value
    let output = match Command::new("pmset").args(["-g"]).output() {
        Ok(o) => o,
        Err(_) => return false,
    };

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut low_power = false;
    for line in stdout.lines() {
        if line.contains("lowpowermode") {
            // Parse "lowpowermode         1" or "lowpowermode         0"
            if let Some(value) = line.split_whitespace().last() {
                low_power = value == "1";
                break;
            }
        }
    }

    // Update cache
    if let Ok(mut cache) = LOW_POWER_MODE_CACHE.write() {
        *cache = Some((low_power, Instant::now()));
    }

    low_power
}

/// Get power and battery information on macOS using IOKit
#[cfg(target_os = "macos")]
pub async fn get_power_info() -> PowerUsage {
    let data = match iokit::get_battery_data() {
        Some(d) => d,
        None => return PowerUsage::default(),
    };

    let low_power_mode = get_low_power_mode();

    let mut power = PowerUsage {
        battery_installed: data.battery_installed,
        battery_percentage: data.current_capacity.map(|v| v as f32),
        fully_charged: data.fully_charged,
        external_connected: data.external_connected,
        low_power_mode,
        cycle_count: data.cycle_count.map(|v| v as i32),
        design_capacity_mah: data.design_capacity.map(|v| v as i32),
        max_capacity_mah: data.nominal_charge_capacity.map(|v| v as i32),
        time_remaining_minutes: data.time_remaining.and_then(|v| {
            // 65535 means calculating or N/A
            if v != 65535 {
                Some(v as i32)
            } else {
                None
            }
        }),
        adapter_watts: data.adapter_watts.map(|v| v as i32),
        adapter_description: data.adapter_description,
        ..Default::default()
    };

    // Handle amperage (may be unsigned representation of negative value)
    if let Some(amp) = data.amperage {
        // Convert from u64 representation to signed if needed
        power.battery_amperage = Some(amp as i32);
    }

    // Convert voltage from mV to V
    if let Some(mv) = data.voltage_mv {
        power.battery_voltage = Some(mv as f32 / 1000.0);
    }

    // Convert adapter voltage from mV to V
    if let Some(mv) = data.adapter_voltage_mv {
        power.adapter_voltage = Some(mv as f32 / 1000.0);
    }

    // Calculate battery health
    if let (Some(max), Some(design)) = (power.max_capacity_mah, power.design_capacity_mah) {
        if design > 0 {
            power.battery_health = Some((max as f32 / design as f32) * 100.0);
        }
    }

    // System power: use SystemPowerIn if available (on AC), otherwise SystemLoad (on battery)
    if let Some(mw) = data.system_power_in_mw {
        if mw > 0 {
            power.system_power_watts = Some(mw as f32 / 1000.0);
        }
    }
    if power.system_power_watts.is_none() || power.system_power_watts == Some(0.0) {
        if let Some(mw) = data.system_load_mw {
            if mw > 0 {
                power.system_power_watts = Some(mw as f32 / 1000.0);
            }
        }
    }

    // Battery power (convert from possibly-negative i64)
    if let Some(mw) = data.battery_power_mw {
        let signed_mw = mw as i64;
        if signed_mw != 0 {
            power.battery_power_watts = Some((signed_mw.abs() as f32) / 1000.0);
        }
    }

    power
}

/// Get power info stub for non-macOS platforms
#[cfg(not(target_os = "macos"))]
pub async fn get_power_info() -> PowerUsage {
    PowerUsage::default()
}

/// A single battery history entry
#[derive(Debug, Clone)]
pub struct BatteryHistoryEntry {
    /// Timestamp in ISO 8601 format
    pub timestamp: String,
    /// Battery charge percentage (0-100)
    pub charge_percentage: i32,
    /// Whether on AC power (true) or battery (false)
    pub on_ac_power: bool,
}

/// Battery history data
#[derive(Debug, Clone, Default)]
pub struct BatteryHistory {
    /// List of battery history entries, sorted by time (oldest first)
    pub entries: Vec<BatteryHistoryEntry>,
}

/// Get battery history from pmset log on macOS
#[cfg(target_os = "macos")]
pub async fn get_battery_history(hours: u32) -> BatteryHistory {
    use chrono::{DateTime, Utc};
    use std::process::Command;

    let output = match Command::new("pmset").args(["-g", "log"]).output() {
        Ok(o) => o,
        Err(_) => return BatteryHistory::default(),
    };

    let stdout = String::from_utf8_lossy(&output.stdout);
    let cutoff_time = Utc::now() - chrono::Duration::hours(hours as i64);
    let mut entries = Vec::new();

    // Parse lines like:
    // 2025-12-31 19:14:59 +0000 Assertions          	Summary- [System: PrevIdle DeclUser kDisp] Using Batt(Charge: 100)
    // 2025-12-31 19:15:03 +0000 Assertions          	Summary- [System: PrevIdle DeclUser kDisp] Using AC(Charge: 100)
    for line in stdout.lines() {
        // Look for lines with charge info
        if !line.contains("(Charge:") {
            continue;
        }

        // Extract timestamp (first 25 chars: "2025-12-31 19:14:59 +0000")
        if line.len() < 25 {
            continue;
        }
        let timestamp_str = &line[0..25];

        // Parse timestamp
        let timestamp = match DateTime::parse_from_str(timestamp_str, "%Y-%m-%d %H:%M:%S %z") {
            Ok(t) => t,
            Err(_) => continue,
        };

        // Skip entries older than cutoff
        if timestamp.with_timezone(&Utc) < cutoff_time {
            continue;
        }

        // Extract charge percentage
        let charge_start = match line.find("Charge:") {
            Some(pos) => pos + 7,
            None => continue,
        };
        let charge_end = match line[charge_start..].find(')') {
            Some(pos) => charge_start + pos,
            None => continue,
        };
        let charge_str = line[charge_start..charge_end].trim();
        let charge: i32 = match charge_str.parse() {
            Ok(c) => c,
            Err(_) => continue,
        };

        // Determine if on AC or battery
        let on_ac = line.contains("Using AC");

        entries.push(BatteryHistoryEntry {
            timestamp: timestamp.to_rfc3339(),
            charge_percentage: charge,
            on_ac_power: on_ac,
        });
    }

    // Deduplicate consecutive entries with same charge and power source
    let mut deduplicated: Vec<BatteryHistoryEntry> = Vec::new();
    for entry in entries {
        if let Some(last) = deduplicated.last() {
            if last.charge_percentage == entry.charge_percentage
                && last.on_ac_power == entry.on_ac_power
            {
                continue;
            }
        }
        deduplicated.push(entry);
    }

    BatteryHistory {
        entries: deduplicated,
    }
}

/// Get battery history stub for non-macOS platforms
#[cfg(not(target_os = "macos"))]
pub async fn get_battery_history(_hours: u32) -> BatteryHistory {
    BatteryHistory::default()
}
