use std::collections::HashMap;

use sysinfo::{CpuExt, DiskExt, NetworkExt, SystemExt};
use systemstat::Platform;
use vital_service_api::models::{CpuCache, CpuUsage};

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
    let info = sysinfo.global_cpu_info();
    Box::new(CpuUsage {
        name: info.name().to_string(),
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

fn truncate_two_precision(num:f32) -> f32 {
    f32::trunc(num  * 100.0) / 100.0
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
