use std::{collections::HashMap, process::Command};

use sysinfo::Cpu;
use systemstat::Platform;
use vital_service_api::models::CpuUsage;
use std::str;

pub async fn get_cpu_util(
    sysinfo: &sysinfo::System,
    sysstat: &systemstat::System,
) -> Box<CpuUsage> {
    let mut core_percentages = Vec::new();
    let mut core_clocks_mhz = Vec::new();

    for processor in sysinfo.cpus() {
        core_percentages.push(truncate_two_precision(processor.cpu_usage()));
        core_clocks_mhz.push(processor.frequency() as i32);
    }

    let mut temperature_readings = HashMap::new();
    if let Ok(temp) = sysstat.cpu_temp() {
        temperature_readings.insert("CPU Package".to_string(), temp as f32);
    }

    // Get CPU load breakdown (system/user/idle) on macOS
    #[cfg(target_os = "macos")]
    {
        if let Some((system, user, idle)) = get_cpu_load_breakdown() {
            temperature_readings.insert("System".to_string(), system);
            temperature_readings.insert("User".to_string(), user);
            temperature_readings.insert("Idle".to_string(), idle);
        }
    }

    let info = sysinfo.global_cpu_info();
    Box::new(CpuUsage {
        name: get_name(&info),
        cpu_cache: None,
        brand: Some(info.brand().to_string()),
        vendor_id: Some(info.vendor_id().to_string()),
        core_clocks_mhz,
        total_core_percentage: truncate_two_precision(info.cpu_usage()),
        power_draw_wattage: None,
        core_percentages,
        temperature_readings: temperature_readings.clone(),
    })
}
#[cfg(target_os = "macos")]
fn get_name(_info: &Cpu) -> String {
    use log::info;

    let output = Command::new("sysctl")
        .arg("-n")
        .arg("machdep.cpu.brand_string")
        .output()
        .expect("Failed to execute command");

    let cpu_name = str::from_utf8(&output.stdout).expect("Output was not valid UTF-8");
    return cpu_name.trim().to_string();
}

#[cfg(target_os = "windows")]
fn get_name(info: &Cpu) -> String {
    info.name().to_string()
}
fn truncate_two_precision(num: f32) -> f32 {
    f32::trunc(num * 100.0) / 100.0
}

// fn get_cpu_cache() -> CpuCache {
//     CpuCache {
//         l1_line_size: optional_i64_from(cache_size::l1_cache_line_size()),
//         l1_size: optional_i64_from(cache_size::l1_cache_size()),
//         l2_line_size: optional_i64_from(cache_size::l2_cache_line_size()),
//         l2_size: optional_i64_from(cache_size::l2_cache_size()),
//         l3_line_size: optional_i64_from(cache_size::l3_cache_line_size()),
//         l3_size: optional_i64_from(cache_size::l3_cache_size()),
//     }
// }

// fn optional_i64_from(obj: Option<usize>) -> Option<i64> {
//     match obj {
//         Some(num) => Some(num as i64),
//         None => None,
//     }
// }

/// Get CPU load breakdown (system, user, idle) on macOS
/// Returns percentages as (system, user, idle)
#[cfg(target_os = "macos")]
fn get_cpu_load_breakdown() -> Option<(f32, f32, f32)> {
    // Use top command to get CPU usage breakdown
    // Output format: "CPU usage: X.XX% user, Y.YY% sys, Z.ZZ% idle"
    let output = Command::new("top")
        .args(["-l", "1", "-n", "0", "-s", "0"])
        .output()
        .ok()?;

    let stdout = str::from_utf8(&output.stdout).ok()?;

    // Find the line containing "CPU usage:"
    for line in stdout.lines() {
        if line.contains("CPU usage:") {
            // Parse: "CPU usage: 5.26% user, 11.57% sys, 83.15% idle"
            let parts: Vec<&str> = line.split(',').collect();
            if parts.len() >= 3 {
                let user = parse_cpu_percentage(parts[0]);
                let system = parse_cpu_percentage(parts[1]);
                let idle = parse_cpu_percentage(parts[2]);

                if let (Some(u), Some(s), Some(i)) = (user, system, idle) {
                    return Some((s, u, i));
                }
            }
        }
    }

    None
}

/// Parse a CPU percentage string like "5.26% user" or " 11.57% sys"
#[cfg(target_os = "macos")]
fn parse_cpu_percentage(s: &str) -> Option<f32> {
    // Find the percentage value (number before '%')
    let s = s.trim();
    for part in s.split_whitespace() {
        if part.ends_with('%') {
            let num_str = part.trim_end_matches('%');
            return num_str.parse::<f32>().ok();
        }
        // Also handle case where % is separate or number comes first
        if let Ok(num) = part.parse::<f32>() {
            return Some(num);
        }
    }
    None
}
