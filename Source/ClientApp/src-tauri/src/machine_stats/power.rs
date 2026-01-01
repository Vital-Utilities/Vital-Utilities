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

/// Get power and battery information on macOS using IOKit
#[cfg(target_os = "macos")]
pub async fn get_power_info() -> PowerUsage {
    let data = match iokit::get_battery_data() {
        Some(d) => d,
        None => return PowerUsage::default(),
    };

    let mut power = PowerUsage {
        battery_installed: data.battery_installed,
        battery_percentage: data.current_capacity.map(|v| v as f32),
        fully_charged: data.fully_charged,
        external_connected: data.external_connected,
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
