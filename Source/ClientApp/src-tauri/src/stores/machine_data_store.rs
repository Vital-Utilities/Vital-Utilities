//! Machine data store for aggregating hardware and software performance data.

use chrono::{DateTime, Duration, Utc};
use dashmap::DashMap;
use std::collections::HashMap;

use crate::models::{
    BatteryHistory, BatteryHistoryEntry, CpuData, CpuUsage, CpuUsageMetricModel, DiskUsageMetricModel,
    DiskUsages, GetMachineDynamicDataResponse, GetMachineStaticDataResponse, GpuData, GpuUsage,
    GpuUsageMetricModel, MemoryUsage, NetworkAdapterHistory, NetworkAdapterUsages, NetworkHistoryEntry,
    ParentChildModelDto, PowerUsage, RamData, RamUsageMetricModel, TimeSeriesMachineMetricsModel,
    TimeSeriesMachineMetricsResponse, DateRange,
};
use std::sync::RwLock;

/// Holds the current state of hardware metrics
pub struct MachineDataStore {
    /// Current CPU usage data
    pub cpu_usage: DashMap<String, CpuUsage>,
    /// Current memory usage data
    pub memory_usage: DashMap<String, MemoryUsage>,
    /// Current GPU usage data
    pub gpu_usage: DashMap<i32, GpuUsage>,
    /// Current disk usage data
    pub disk_usage: DashMap<String, DiskUsages>,
    /// Current network usage data
    pub network_usage: DashMap<String, NetworkAdapterUsages>,
    /// Network history for charts (keyed by MAC address)
    pub network_history: DashMap<String, NetworkAdapterHistory>,
    /// Current power/battery usage data
    pub power_usage: DashMap<String, PowerUsage>,
    /// Process CPU usage (PID -> percentage)
    pub process_cpu_usage: DashMap<i32, f32>,
    /// Process RAM usage in bytes (PID -> bytes)
    pub process_ram_usage: DashMap<i32, f32>,
    /// Process disk activity (PID -> bytes per second)
    pub process_disk_activity: DashMap<i32, f64>,
    /// Process GPU usage (PID -> percentage)
    pub process_gpu_usage: DashMap<i32, f32>,
    /// Process CPU time in seconds (total time the process has been running on CPU)
    pub process_cpu_time: DashMap<i32, u64>,
    /// Running processes with parent-child hierarchy
    pub running_processes: DashMap<i32, ParentChildModelDto>,
    /// Metrics cache for recent data (in-memory only)
    pub metrics_cache: DashMap<DateTime<Utc>, TimeSeriesMachineMetricsModel>,
    /// Static CPU data (populated once at startup)
    static_cpu: DashMap<String, CpuData>,
    /// Static GPU data (populated once at startup)
    static_gpu: DashMap<i32, GpuData>,
    /// Static RAM data (populated once at startup)
    static_ram: DashMap<i32, RamData>,
    /// Cached battery history (refreshed periodically)
    battery_history_cache: RwLock<Option<BatteryHistoryCache>>,
}

/// Cached battery history with expiration
struct BatteryHistoryCache {
    /// The cached history data
    history: BatteryHistory,
    /// When the cache was last refreshed
    last_refresh: DateTime<Utc>,
    /// How many hours of history was requested
    hours: u32,
}

impl MachineDataStore {
    /// Create a new machine data store
    pub fn new() -> Self {
        Self {
            cpu_usage: DashMap::new(),
            memory_usage: DashMap::new(),
            gpu_usage: DashMap::new(),
            disk_usage: DashMap::new(),
            network_usage: DashMap::new(),
            network_history: DashMap::new(),
            power_usage: DashMap::new(),
            process_cpu_usage: DashMap::new(),
            process_ram_usage: DashMap::new(),
            process_disk_activity: DashMap::new(),
            process_gpu_usage: DashMap::new(),
            process_cpu_time: DashMap::new(),
            running_processes: DashMap::new(),
            metrics_cache: DashMap::new(),
            static_cpu: DashMap::new(),
            static_gpu: DashMap::new(),
            static_ram: DashMap::new(),
            battery_history_cache: RwLock::new(None),
        }
    }

    /// Get battery history, using cache if available and not stale
    /// Cache is refreshed every 2 minutes or when hours parameter changes
    pub async fn get_battery_history(&self, hours: u32) -> BatteryHistory {
        const CACHE_TTL_SECONDS: i64 = 120; // 2 minutes

        // Check if we have a valid cache
        {
            let cache_guard = self.battery_history_cache.read().unwrap();
            if let Some(ref cache) = *cache_guard {
                let age = Utc::now() - cache.last_refresh;
                if age.num_seconds() < CACHE_TTL_SECONDS && cache.hours == hours {
                    return cache.history.clone();
                }
            }
        }

        // Cache miss or stale - fetch new data
        let history = Self::fetch_battery_history(hours).await;

        // Update cache
        {
            let mut cache_guard = self.battery_history_cache.write().unwrap();
            *cache_guard = Some(BatteryHistoryCache {
                history: history.clone(),
                last_refresh: Utc::now(),
                hours,
            });
        }

        history
    }

    /// Fetch battery history from pmset (internal method)
    #[cfg(target_os = "macos")]
    async fn fetch_battery_history(hours: u32) -> BatteryHistory {
        use crate::machine_stats::power;

        let raw_history = power::get_battery_history(hours).await;

        // Convert from power module type to DTO
        let entries = raw_history
            .entries
            .into_iter()
            .map(|e| BatteryHistoryEntry {
                timestamp: e.timestamp,
                charge_percentage: e.charge_percentage,
                on_ac_power: e.on_ac_power,
            })
            .collect();

        BatteryHistory { entries }
    }

    /// Fetch battery history stub for non-macOS platforms
    #[cfg(not(target_os = "macos"))]
    async fn fetch_battery_history(_hours: u32) -> BatteryHistory {
        BatteryHistory { entries: vec![] }
    }

    /// Initialize static CPU data from sysinfo
    pub fn init_static_cpu(&self, sys: &sysinfo::System) {
        let cpus = sys.cpus();
        // In sysinfo 0.37+, physical_core_count() is now a static method
        let physical_core_count = sysinfo::System::physical_core_count().unwrap_or(cpus.len()) as i32;
        let logical_core_count = cpus.len() as i32;

        // Get CPU name from first core
        let cpu_name = if let Some(cpu) = cpus.first() {
            cpu.brand().to_string()
        } else {
            "Unknown CPU".to_string()
        };

        // Get cache sizes (platform-specific)
        let (l1_cache_size, l2_cache_size, l3_cache_size) = get_cpu_cache_sizes();

        let cpu_data = CpuData {
            name: cpu_name,
            number_of_enabled_core: physical_core_count,
            number_of_cores: physical_core_count,
            thread_count: logical_core_count,
            virtualization_firmware_enabled: false,
            l1_cache_size,
            l2_cache_size,
            l3_cache_size,
        };

        self.static_cpu.insert("default".to_string(), cpu_data);
    }

    /// Initialize static GPU data
    pub fn init_static_gpu(&self, gpus: &[GpuUsage]) {
        for gpu in gpus {
            let gpu_data = GpuData {
                name: gpu.name.clone().unwrap_or_else(|| "Unknown GPU".to_string()),
                memory_total_bytes: gpu.total_memory_bytes.map(|v| v as i64),
            };
            self.static_gpu.insert(gpu.device_index, gpu_data);
        }
    }

    /// Initialize static RAM data from sysinfo
    pub fn init_static_ram(&self, sys: &sysinfo::System) {
        let total_memory = sys.total_memory();

        // Create a single RAM entry with total system memory
        // On macOS/Linux we don't have detailed DIMM info from sysinfo
        let ram_data = RamData {
            name: Some("System Memory".to_string()),
            part_number: None,
            ram_type: None,
            speed_mhz: None,
            slot_number: Some(0),
            slot_channel: None,
            configured_clock_speed_mhz: None,
            capacity: Some(total_memory as f64),
        };

        self.static_ram.insert(0, ram_data);
    }

    /// Update CPU usage data
    pub fn update_cpu(&self, cpu: CpuUsage) {
        self.cpu_usage.insert("default".to_string(), cpu);
    }

    /// Update memory usage data
    pub fn update_memory(&self, memory: MemoryUsage) {
        self.memory_usage.insert("default".to_string(), memory);
    }

    /// Update GPU usage data
    pub fn update_gpu(&self, gpus: Vec<GpuUsage>) {
        self.gpu_usage.clear();
        for gpu in gpus {
            self.gpu_usage.insert(gpu.device_index, gpu);
        }
    }

    /// Update disk usage data
    pub fn update_disks(&self, disks: DiskUsages) {
        self.disk_usage.insert("default".to_string(), disks);
    }

    /// Update network usage data and history
    pub fn update_network(&self, network: NetworkAdapterUsages) {
        // Update history for each adapter
        for (mac, adapter) in &network.adapters {
            if let Some(usage) = &adapter.usage {
                let mut history = self.network_history
                    .entry(mac.clone())
                    .or_insert_with(|| NetworkAdapterHistory {
                        history: Vec::with_capacity(60),
                        max_speed_bps: 1_000_000, // 1 Mbps default
                    });

                // Add new entry
                history.history.push(NetworkHistoryEntry {
                    download_bps: usage.recieve_bps,
                    upload_bps: usage.send_bps,
                });

                // Keep only last 60 entries
                if history.history.len() > 60 {
                    history.history.remove(0);
                }

                // Update max speed with headroom
                let current_max = usage.recieve_bps.max(usage.send_bps);
                let history_max = history.history.iter()
                    .map(|h| h.download_bps.max(h.upload_bps))
                    .max()
                    .unwrap_or(0);
                let observed_max = current_max.max(history_max);
                let headroom = (observed_max as f64 * 1.2) as i64;

                if headroom > history.max_speed_bps {
                    history.max_speed_bps = headroom;
                } else if headroom < history.max_speed_bps / 2 && history.max_speed_bps > 1_000_000 {
                    // Slowly decrease if speeds are much lower
                    history.max_speed_bps = (history.max_speed_bps as f64 * 0.95).max(1_000_000.0) as i64;
                }
            }
        }

        self.network_usage.insert("default".to_string(), network);
    }

    /// Update power/battery usage data
    pub fn update_power(&self, power: PowerUsage) {
        self.power_usage.insert("default".to_string(), power);
    }

    /// Update process metrics
    pub fn update_process_metrics(
        &self,
        cpu_usage: HashMap<i32, f32>,
        ram_usage: HashMap<i32, f32>,
        disk_activity: HashMap<i32, f64>,
        gpu_usage: HashMap<i32, f32>,
    ) {
        self.process_cpu_usage.clear();
        self.process_ram_usage.clear();
        self.process_disk_activity.clear();
        self.process_gpu_usage.clear();

        for (pid, usage) in cpu_usage {
            self.process_cpu_usage.insert(pid, usage);
        }
        for (pid, usage) in ram_usage {
            self.process_ram_usage.insert(pid, usage);
        }
        for (pid, activity) in disk_activity {
            self.process_disk_activity.insert(pid, activity);
        }
        for (pid, usage) in gpu_usage {
            self.process_gpu_usage.insert(pid, usage);
        }
    }

    /// Update running processes
    pub fn update_running_processes(&self, processes: HashMap<i32, ParentChildModelDto>) {
        self.running_processes.clear();
        for (pid, process) in processes {
            self.running_processes.insert(pid, process);
        }
    }

    /// Get dynamic machine data for API response
    pub fn get_dynamic_data(&self) -> GetMachineDynamicDataResponse {
        let cpu_usage_data = self
            .cpu_usage
            .get("default")
            .map(|r| r.value().clone());

        let ram_usages_data = self
            .memory_usage
            .get("default")
            .map(|r| r.value().clone());

        let gpu_usage_data: Vec<GpuUsage> = self
            .gpu_usage
            .iter()
            .map(|r| r.value().clone())
            .collect();

        let disk_usages = self
            .disk_usage
            .get("default")
            .map(|r| r.value().clone());

        let network_usage_data = self
            .network_usage
            .get("default")
            .map(|r| r.value().clone());

        let network_history: HashMap<String, NetworkAdapterHistory> = self
            .network_history
            .iter()
            .map(|r| (r.key().clone(), r.value().clone()))
            .collect();

        let power_usage_data = self
            .power_usage
            .get("default")
            .map(|r| r.value().clone());

        let process_cpu_usage: HashMap<i32, f32> = self
            .process_cpu_usage
            .iter()
            .map(|r| (*r.key(), *r.value()))
            .collect();

        let process_ram_usage_bytes: HashMap<i32, f32> = self
            .process_ram_usage
            .iter()
            .map(|r| (*r.key(), *r.value()))
            .collect();

        let process_disk_bytes_per_sec_activity: HashMap<i32, f64> = self
            .process_disk_activity
            .iter()
            .map(|r| (*r.key(), *r.value()))
            .collect();

        let process_gpu_usage: HashMap<i32, f32> = self
            .process_gpu_usage
            .iter()
            .map(|r| (*r.key(), *r.value()))
            .collect();

        let process_cpu_time_secs: HashMap<i32, u64> = self
            .process_cpu_time
            .iter()
            .map(|r| (*r.key(), *r.value()))
            .collect();

        // Extract CPU temperature from cpu_usage
        let cpu_temperature = cpu_usage_data
            .as_ref()
            .map(|cpu| cpu.temperature_readings.clone());

        GetMachineDynamicDataResponse {
            cpu_usage_data,
            ram_usages_data,
            gpu_usage_data: if gpu_usage_data.is_empty() {
                None
            } else {
                Some(gpu_usage_data)
            },
            disk_usages,
            network_usage_data,
            network_history: if network_history.is_empty() {
                None
            } else {
                Some(network_history)
            },
            power_usage_data,
            process_cpu_usage: if process_cpu_usage.is_empty() {
                None
            } else {
                Some(process_cpu_usage)
            },
            process_cpu_threads_usage: None, // Not tracked separately
            process_thread_count: None,      // Not tracked separately
            process_ram_usage_bytes: if process_ram_usage_bytes.is_empty() {
                None
            } else {
                Some(process_ram_usage_bytes)
            },
            process_disk_bytes_per_sec_activity: if process_disk_bytes_per_sec_activity.is_empty() {
                None
            } else {
                Some(process_disk_bytes_per_sec_activity)
            },
            cpu_temperature,
            process_gpu_usage: if process_gpu_usage.is_empty() {
                None
            } else {
                Some(process_gpu_usage)
            },
            process_cpu_time_secs: if process_cpu_time_secs.is_empty() {
                None
            } else {
                Some(process_cpu_time_secs)
            },
        }
    }

    /// Get static machine data for API response
    pub fn get_static_data(&self) -> GetMachineStaticDataResponse {
        let cpu = self.static_cpu.get("default").map(|r| r.value().clone());
        let gpu: Vec<GpuData> = self.static_gpu.iter().map(|r| r.value().clone()).collect();
        let ram: Vec<RamData> = self.static_ram.iter().map(|r| r.value().clone()).collect();

        GetMachineStaticDataResponse {
            direct_x_version: None,
            cpu,
            ram: if ram.is_empty() { None } else { Some(ram) },
            gpu: if gpu.is_empty() { None } else { Some(gpu) },
        }
    }

    /// Get running processes for API response
    pub fn get_running_processes(&self) -> HashMap<i32, ParentChildModelDto> {
        self.running_processes
            .iter()
            .map(|r| (*r.key(), r.value().clone()))
            .collect()
    }

    /// Add a metrics snapshot to the cache
    pub fn add_to_cache(&self, metrics: TimeSeriesMachineMetricsModel) {
        self.metrics_cache.insert(metrics.date_time_offset, metrics);
    }

    /// Trim old entries from the cache
    pub fn trim_cache(&self, max_age: Duration) {
        let cutoff = Utc::now() - max_age;
        self.metrics_cache.retain(|dt, _| *dt > cutoff);
    }

    /// Get metrics from cache within a time range
    pub fn get_metrics_from_cache(
        &self,
        earliest: DateTime<Utc>,
        latest: DateTime<Utc>,
    ) -> Vec<TimeSeriesMachineMetricsModel> {
        self.metrics_cache
            .iter()
            .filter(|r| *r.key() >= earliest && *r.key() <= latest)
            .map(|r| r.value().clone())
            .collect()
    }

    /// Get metrics for a time range (from in-memory cache only)
    pub fn get_metrics(
        &self,
        earliest: DateTime<Utc>,
        latest: DateTime<Utc>,
    ) -> TimeSeriesMachineMetricsResponse {
        let mut metrics = self.get_metrics_from_cache(earliest, latest);

        // Sort by timestamp
        metrics.sort_by(|a, b| a.date_time_offset.cmp(&b.date_time_offset));

        TimeSeriesMachineMetricsResponse {
            request_range: DateRange {
                earliest: earliest.to_rfc3339(),
                latest: latest.to_rfc3339(),
            },
            metrics,
        }
    }

    /// Create current metrics snapshot for storage
    pub fn create_current_snapshot(&self) -> TimeSeriesMachineMetricsModel {
        let cpu_data = self.cpu_usage.get("default").map(|cpu| {
            vec![CpuUsageMetricModel {
                id: None,
                unique_identifier: Some("cpu0".to_string()),
                total_core_usage_percentage: Some(cpu.total_core_percentage),
                package_temperature: cpu.temperature_readings.get("CPU Package")
                    .or_else(|| cpu.temperature_readings.get("Package"))
                    .or_else(|| cpu.temperature_readings.get("CPU die"))
                    .or_else(|| cpu.temperature_readings.get("CPU"))
                    .or_else(|| {
                        // Find any temperature reading that looks like a CPU temp (tdie = die temperature)
                        cpu.temperature_readings.iter()
                            .filter(|(k, _)| {
                                let lower = k.to_lowercase();
                                lower.contains("cpu") || lower.contains("die") || lower.contains("core")
                            })
                            .map(|(_, v)| v)
                            .max_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal))
                    })
                    .copied(),
                power_draw_wattage: cpu.power_draw_wattage,
                core_clocks_mhz: Some(
                    cpu.core_clocks_mhz
                        .iter()
                        .enumerate()
                        .map(|(i, &v)| (i as i32, v as f32))
                        .collect(),
                ),
                cores_usage_percentage: Some(
                    cpu.core_percentages
                        .iter()
                        .enumerate()
                        .map(|(i, &v)| (i as i32, v))
                        .collect(),
                ),
            }]
        });

        let ram_data = self.memory_usage.get("default").map(|mem| RamUsageMetricModel {
            id: None,
            unique_identifier: Some("ram0".to_string()),
            used_memory_bytes: Some(mem.used_memory_bytes as f64),
            total_visible_memory_bytes: Some(mem.total_visible_memory_bytes as f64),
        });

        let gpu_data: Vec<GpuUsageMetricModel> = self
            .gpu_usage
            .iter()
            .map(|r| {
                let gpu = r.value();
                GpuUsageMetricModel {
                    id: None,
                    unique_identifier: Some(format!("gpu{}", gpu.device_index)),
                    core_usage_percentage: gpu.load.as_ref().and_then(|l| l.core_percentage),
                    vram_usage_bytes: gpu.memory_used_bytes.map(|v| v as f32),
                    vram_total_bytes: gpu.total_memory_bytes.map(|v| v as f32),
                    core_temperature: gpu.temperature_readings.get("GPU Core").copied(),
                    power_draw_wattage: gpu.power_draw_watt.map(|v| v as f32),
                    fan_percentage: gpu.fan_percentage.clone(),
                }
            })
            .collect();

        // Collect disk usage data
        let disk_data: Vec<DiskUsageMetricModel> = self
            .disk_usage
            .get("default")
            .map(|disk_usages| {
                disk_usages.disks
                    .iter()
                    .map(|(mount_point, disk)| DiskUsageMetricModel {
                        id: None,
                        unique_identifier: Some(mount_point.clone()),
                        serial: disk.serial.clone(),
                        name: Some(disk.name.clone()),
                        drive_letter: disk.letter.clone(),
                        used_space_percentage: disk.load.as_ref().and_then(|l| l.used_space_percentage),
                        used_space_bytes: disk.load.as_ref().and_then(|l| l.used_space_bytes),
                        total_space_bytes: disk.load.as_ref().and_then(|l| l.total_space_bytes),
                        write_activity_percentage: disk.load.as_ref().and_then(|l| l.write_activity_percentage),
                        total_activity_percentage: disk.load.as_ref().and_then(|l| l.total_activity_percentage),
                        read_rate_bytes_per_second: disk.throughput.as_ref().and_then(|t| t.read_rate_bytes_per_second.map(|v| v as f64)),
                        write_rate_bytes_per_second: disk.throughput.as_ref().and_then(|t| t.write_rate_bytes_per_second.map(|v| v as f64)),
                        data_read_bytes: disk.disk_health.as_ref().and_then(|h| h.total_bytes_read.map(|v| v as f64)),
                        data_written_bytes: disk.disk_health.as_ref().and_then(|h| h.total_bytes_written.map(|v| v as f64)),
                        temperatures: disk.temperatures.clone(),
                    })
                    .collect()
            })
            .unwrap_or_default();

        TimeSeriesMachineMetricsModel {
            id: 0, // Will be set by database
            date_time_offset: Utc::now(),
            cpu_usage_data: cpu_data,
            gpu_usage_data: if gpu_data.is_empty() {
                None
            } else {
                Some(gpu_data)
            },
            ram_usage_data: ram_data,
            network_usage_data: None, // TODO: implement
            disk_usage_data: if disk_data.is_empty() {
                None
            } else {
                Some(disk_data)
            },
        }
    }
}

impl Default for MachineDataStore {
    fn default() -> Self {
        Self::new()
    }
}

/// Get CPU cache sizes (L1, L2, L3) in KB
/// Returns (l1_kb, l2_kb, l3_kb)
fn get_cpu_cache_sizes() -> (u64, u64, u64) {
    #[cfg(target_os = "macos")]
    {
        get_cpu_cache_sizes_macos()
    }
    #[cfg(not(target_os = "macos"))]
    {
        (0, 0, 0)
    }
}

#[cfg(target_os = "macos")]
fn get_cpu_cache_sizes_macos() -> (u64, u64, u64) {
    use std::process::Command;

    fn get_sysctl_value(key: &str) -> Option<u64> {
        let output = Command::new("sysctl")
            .arg("-n")
            .arg(key)
            .output()
            .ok()?;

        if output.status.success() {
            let value_str = std::str::from_utf8(&output.stdout).ok()?.trim();
            value_str.parse::<u64>().ok()
        } else {
            None
        }
    }

    // Apple Silicon uses different sysctl keys than Intel
    // Try Apple Silicon keys first, then Intel keys

    // L1 instruction + data cache (Apple Silicon reports per-core, we want total per core)
    let l1_size = get_sysctl_value("hw.l1icachesize")
        .or_else(|| get_sysctl_value("hw.l1dcachesize"))
        .unwrap_or(0);

    // L2 cache
    let l2_size = get_sysctl_value("hw.l2cachesize").unwrap_or(0);

    // L3 cache (may not exist on all Apple Silicon chips)
    let l3_size = get_sysctl_value("hw.l3cachesize").unwrap_or(0);

    // Convert bytes to KB
    (l1_size / 1024, l2_size / 1024, l3_size / 1024)
}
