//! Power and battery information collection for macOS.

use std::collections::HashMap;
use std::process::Command;
use std::str;

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

/// Get power and battery information on macOS
#[cfg(target_os = "macos")]
pub async fn get_power_info() -> PowerUsage {
    let output = match Command::new("ioreg")
        .args(["-r", "-c", "AppleSmartBattery", "-d", "1"])
        .output()
    {
        Ok(o) => o,
        Err(_) => return PowerUsage::default(),
    };

    if !output.status.success() {
        return PowerUsage::default();
    }

    let output_str = match str::from_utf8(&output.stdout) {
        Ok(s) => s,
        Err(_) => return PowerUsage::default(),
    };

    // If no battery info available, return default
    if !output_str.contains("AppleSmartBattery") {
        return PowerUsage::default();
    }

    let mut power = PowerUsage {
        battery_installed: true,
        ..Default::default()
    };

    // Parse simple key-value pairs
    power.battery_percentage = parse_i32_value(output_str, "\"CurrentCapacity\"").map(|v| v as f32);
    power.fully_charged = parse_bool_value(output_str, "\"FullyCharged\"").unwrap_or(false);
    power.external_connected = parse_bool_value(output_str, "\"ExternalConnected\"").unwrap_or(false);
    power.battery_amperage = parse_i32_value(output_str, "\"Amperage\"");
    power.cycle_count = parse_i32_value(output_str, "\"CycleCount\"");
    power.design_capacity_mah = parse_i32_value(output_str, "\"DesignCapacity\"");
    power.max_capacity_mah = parse_i32_value(output_str, "\"NominalChargeCapacity\"");

    // Parse voltage (in mV, convert to V)
    if let Some(mv) = parse_i32_value(output_str, "\"AppleRawBatteryVoltage\"") {
        power.battery_voltage = Some(mv as f32 / 1000.0);
    }

    // Calculate battery health
    if let (Some(max), Some(design)) = (power.max_capacity_mah, power.design_capacity_mah) {
        if design > 0 {
            power.battery_health = Some((max as f32 / design as f32) * 100.0);
        }
    }

    // Parse time remaining
    if let Some(time) = parse_i32_value(output_str, "\"TimeRemaining\"") {
        // 65535 means calculating or N/A
        if time != 65535 {
            power.time_remaining_minutes = Some(time);
        }
    }

    // Parse PowerTelemetryData for system power consumption
    if let Some(telemetry_start) = output_str.find("\"PowerTelemetryData\"") {
        let telemetry_section = &output_str[telemetry_start..];

        // SystemPowerIn is in milliwatts
        if let Some(mw) = parse_i32_in_section(telemetry_section, "\"SystemPowerIn\"") {
            power.system_power_watts = Some(mw as f32 / 1000.0);
        }

        // BatteryPower is in milliwatts (can be 0 when on AC)
        if let Some(mw) = parse_i32_in_section(telemetry_section, "\"BatteryPower\"") {
            // When discharging, this shows power from battery
            if mw != 0 {
                power.battery_power_watts = Some(mw as f32 / 1000.0);
            }
        }
    }

    // Parse AdapterDetails
    if let Some(adapter_start) = output_str.find("\"AdapterDetails\"") {
        let adapter_section = &output_str[adapter_start..];

        if let Some(watts) = parse_i32_in_section(adapter_section, "\"Watts\"") {
            power.adapter_watts = Some(watts);
        }

        // AdapterVoltage is in mV
        if let Some(mv) = parse_i32_in_section(adapter_section, "\"AdapterVoltage\"") {
            power.adapter_voltage = Some(mv as f32 / 1000.0);
        }

        // Parse description - it's in quotes like "Description"="pd charger"
        if let Some(desc_start) = adapter_section.find("\"Description\"=\"") {
            let after_key = &adapter_section[desc_start + 15..];
            if let Some(end) = after_key.find('"') {
                power.adapter_description = Some(after_key[..end].to_string());
            }
        }
    }

    power
}

/// Parse an integer value from ioreg output
fn parse_i32_value(output: &str, key: &str) -> Option<i32> {
    // Format: "Key" = 123
    let pattern = format!("{} = ", key);
    if let Some(start) = output.find(&pattern) {
        let after_key = &output[start + pattern.len()..];
        let end = after_key.find(|c: char| !c.is_ascii_digit() && c != '-').unwrap_or(after_key.len());
        let value_str = &after_key[..end];
        return value_str.parse::<i32>().ok();
    }
    None
}

/// Parse a boolean value from ioreg output
fn parse_bool_value(output: &str, key: &str) -> Option<bool> {
    // Format: "Key" = Yes or "Key" = No
    let pattern = format!("{} = ", key);
    if let Some(start) = output.find(&pattern) {
        let after_key = &output[start + pattern.len()..];
        if after_key.starts_with("Yes") {
            return Some(true);
        } else if after_key.starts_with("No") {
            return Some(false);
        }
    }
    None
}

/// Parse an integer value within a section (for nested dicts)
fn parse_i32_in_section(section: &str, key: &str) -> Option<i32> {
    // Format within dict: "Key"=123 (no spaces around =)
    let pattern = format!("{}=", key);
    if let Some(start) = section.find(&pattern) {
        let after_key = &section[start + pattern.len()..];
        let end = after_key.find(|c: char| !c.is_ascii_digit() && c != '-').unwrap_or(after_key.len());
        let value_str = &after_key[..end];
        return value_str.parse::<i32>().ok();
    }
    None
}

/// Get power info stub for non-macOS platforms
#[cfg(not(target_os = "macos"))]
pub async fn get_power_info() -> PowerUsage {
    PowerUsage::default()
}
