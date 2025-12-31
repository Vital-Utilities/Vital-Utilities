//! Memory information collection with macOS-specific detailed stats.

use std::process::Command;
use std::str;

/// Extended memory usage data with macOS-specific metrics
#[derive(Debug, Clone, Default)]
pub struct ExtendedMemoryUsage {
    pub total_memory_bytes: i64,
    pub used_memory_bytes: i64,
    pub swap_percentage: f32,
    pub swap_total_bytes: i64,
    pub swap_used_bytes: i64,
    /// Memory actively used by applications
    pub app_memory_bytes: Option<i64>,
    /// Memory that cannot be paged out (kernel, drivers)
    pub wired_memory_bytes: Option<i64>,
    /// Memory that has been compressed
    pub compressed_memory_bytes: Option<i64>,
    /// Memory used for file system cache
    pub cached_files_bytes: Option<i64>,
    /// Memory pressure level (0-100)
    pub memory_pressure: Option<f32>,
}

/// Get memory utilization with extended macOS stats
pub async fn get_mem_util(sysinfo: &sysinfo::System) -> ExtendedMemoryUsage {
    let total_memory = sysinfo.total_memory() as i64;
    let used_memory = sysinfo.used_memory() as i64;
    let swap_total = sysinfo.total_swap() as i64;
    let swap_used = sysinfo.used_swap() as i64;
    let swap_percentage = if swap_total > 0 {
        (swap_used as f32 / swap_total as f32) * 100.0
    } else {
        0.0
    };

    let mut result = ExtendedMemoryUsage {
        total_memory_bytes: total_memory,
        used_memory_bytes: used_memory,
        swap_percentage,
        swap_total_bytes: swap_total,
        swap_used_bytes: swap_used,
        ..Default::default()
    };

    // Get detailed macOS memory stats
    #[cfg(target_os = "macos")]
    {
        if let Some(vm_stats) = get_vm_stat() {
            result.wired_memory_bytes = vm_stats.wired_bytes;
            result.compressed_memory_bytes = vm_stats.compressed_bytes;
            result.cached_files_bytes = vm_stats.cached_bytes;

            // App memory = used - wired - compressed - cached
            // This approximates what Activity Monitor shows as "App Memory"
            if let (Some(wired), Some(compressed), Some(cached)) =
                (vm_stats.wired_bytes, vm_stats.compressed_bytes, vm_stats.cached_bytes) {
                let app_memory = used_memory - wired - compressed;
                result.app_memory_bytes = Some(app_memory.max(0));
            }
        }

        // Get memory pressure
        if let Some(pressure) = get_memory_pressure() {
            result.memory_pressure = Some(pressure);
        }
    }

    result
}

/// macOS vm_stat parsed data
#[cfg(target_os = "macos")]
#[derive(Debug, Default)]
struct VmStatData {
    page_size: i64,
    wired_bytes: Option<i64>,
    compressed_bytes: Option<i64>,
    cached_bytes: Option<i64>,
}

/// Parse vm_stat output on macOS
#[cfg(target_os = "macos")]
fn get_vm_stat() -> Option<VmStatData> {
    let output = Command::new("vm_stat").output().ok()?;

    if !output.status.success() {
        return None;
    }

    let output_str = str::from_utf8(&output.stdout).ok()?;
    let mut data = VmStatData::default();

    // First line contains page size: "Mach Virtual Memory Statistics: (page size of 16384 bytes)"
    if let Some(first_line) = output_str.lines().next() {
        if let Some(start) = first_line.find("page size of ") {
            let after = &first_line[start + 13..];
            if let Some(end) = after.find(' ') {
                if let Ok(size) = after[..end].parse::<i64>() {
                    data.page_size = size;
                }
            }
        }
    }

    if data.page_size == 0 {
        data.page_size = 16384; // Default for Apple Silicon
    }

    // Parse the stats
    for line in output_str.lines() {
        if let Some((key, pages)) = parse_vm_stat_line(line) {
            let bytes = pages * data.page_size;
            match key {
                "Pages wired down" => data.wired_bytes = Some(bytes),
                "Pages occupied by compressor" => data.compressed_bytes = Some(bytes),
                "File-backed pages" => data.cached_bytes = Some(bytes),
                _ => {}
            }
        }
    }

    Some(data)
}

/// Parse a single vm_stat line like "Pages wired down:                        123456."
#[cfg(target_os = "macos")]
fn parse_vm_stat_line(line: &str) -> Option<(&str, i64)> {
    let parts: Vec<&str> = line.split(':').collect();
    if parts.len() != 2 {
        return None;
    }

    let key = parts[0].trim();
    let value_str = parts[1].trim().trim_end_matches('.');
    let pages = value_str.parse::<i64>().ok()?;

    Some((key, pages))
}

/// Get memory pressure percentage on macOS using memory_pressure command
#[cfg(target_os = "macos")]
fn get_memory_pressure() -> Option<f32> {
    // Try using sysctl for memory pressure
    let output = Command::new("sysctl")
        .args(["-n", "kern.memorystatus_vm_pressure_level"])
        .output()
        .ok()?;

    if output.status.success() {
        let value_str = str::from_utf8(&output.stdout).ok()?.trim();
        if let Ok(level) = value_str.parse::<i32>() {
            // Level: 1 = normal, 2 = warn, 4 = critical
            let pressure = match level {
                1 => 0.0,   // Normal
                2 => 50.0,  // Warning
                4 => 100.0, // Critical
                _ => 0.0,
            };
            return Some(pressure);
        }
    }

    None
}
