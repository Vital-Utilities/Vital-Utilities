use std::{collections::HashMap, process::Command};

use sysinfo::{Cpu, Components};
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

    // Try systemstat first (works well on Windows/Linux)
    if let Ok(temp) = sysstat.cpu_temp() {
        temperature_readings.insert("CPU Package".to_string(), temp as f32);
        log::info!("CPU temp from systemstat: {}°C", temp);
    }

    // On macOS, use sysinfo Components for temperature sensors
    #[cfg(target_os = "macos")]
    {
        if temperature_readings.is_empty() {
            let components = Components::new_with_refreshed_list();

            // Log all available components
            log::info!("Available temperature sensors:");
            for component in &components {
                if let Some(temp) = component.temperature() {
                    log::info!("  '{}' = {}°C", component.label(), temp);
                } else {
                    log::info!("  '{}' = N/A", component.label());
                }
            }

            for component in &components {
                let label = component.label().to_lowercase();
                if label.contains("cpu") || label.contains("core") || label.contains("die") || label.contains("peci") || label.contains("soc") {
                    if let Some(temp) = component.temperature() {
                        if !temp.is_nan() {
                            temperature_readings.insert(component.label().to_string(), temp);
                            log::info!("Found CPU temp '{}': {}°C", component.label(), temp);
                        }
                    }
                }
            }

            // If still no temperature found, use any available sensor
            if temperature_readings.is_empty() {
                for component in &components {
                    if let Some(temp) = component.temperature() {
                        if !temp.is_nan() {
                            temperature_readings.insert("CPU Package".to_string(), temp);
                            log::info!("Using '{}' as CPU temp: {}°C", component.label(), temp);
                            break;
                        }
                    }
                }
            }

            if temperature_readings.is_empty() {
                log::warn!("No CPU temperature sensors found on macOS");
            }
        }
    }

    // In sysinfo 0.37+, global_cpu_info() was removed. Use global_cpu_usage() for total usage
    // and get CPU info from the first core
    let first_cpu = sysinfo.cpus().first();
    let total_usage = sysinfo.global_cpu_usage();

    Box::new(CpuUsage {
        name: get_name(first_cpu),
        cpu_cache: None,
        brand: first_cpu.map(|c| c.brand().to_string()),
        vendor_id: first_cpu.map(|c| c.vendor_id().to_string()),
        core_clocks_mhz,
        total_core_percentage: truncate_two_precision(total_usage),
        power_draw_wattage: None,
        core_percentages,
        temperature_readings: temperature_readings.clone(),
    })
}
#[cfg(target_os = "macos")]
fn get_name(_info: Option<&Cpu>) -> String {
    let output = Command::new("sysctl")
        .arg("-n")
        .arg("machdep.cpu.brand_string")
        .output()
        .expect("Failed to execute command");

    let cpu_name = str::from_utf8(&output.stdout).expect("Output was not valid UTF-8");
    cpu_name.trim().to_string()
}

#[cfg(target_os = "windows")]
fn get_name(info: Option<&Cpu>) -> String {
    info.map(|c| c.name().to_string()).unwrap_or_else(|| "Unknown CPU".to_string())
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
