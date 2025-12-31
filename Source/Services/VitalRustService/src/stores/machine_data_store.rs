//! Machine data store for aggregating hardware and software performance data.

use chrono::{DateTime, Duration, Utc};
use dashmap::DashMap;
use std::collections::HashMap;
use std::sync::Arc;

use crate::db::MetricsDb;
use crate::models::{
    CpuUsage, CpuUsageMetricModel, DiskUsageMetricModel, DiskUsages, GetMachineDynamicDataResponse,
    GetMachineStaticDataResponse, GpuUsage, GpuUsageMetricModel, MemoryUsage,
    NetworkAdapterUsages, NetworkUsageMetricModel, ParentChildModelDto, ProcessViewDto,
    RamUsageMetricModel, TimeSeriesMachineMetricsModel, TimeSeriesMachineMetricsResponse, DateRange,
};

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
    /// Process CPU usage (PID -> percentage)
    pub process_cpu_usage: DashMap<i32, f32>,
    /// Process RAM usage in bytes (PID -> bytes)
    pub process_ram_usage: DashMap<i32, f32>,
    /// Process disk activity (PID -> bytes per second)
    pub process_disk_activity: DashMap<i32, f64>,
    /// Process GPU usage (PID -> percentage)
    pub process_gpu_usage: DashMap<i32, f32>,
    /// Running processes with parent-child hierarchy
    pub running_processes: DashMap<i32, ParentChildModelDto>,
    /// Metrics cache for recent data
    pub metrics_cache: DashMap<DateTime<Utc>, TimeSeriesMachineMetricsModel>,
    /// Reference to metrics database
    metrics_db: Option<Arc<MetricsDb>>,
}

impl MachineDataStore {
    /// Create a new machine data store
    pub fn new(metrics_db: Option<Arc<MetricsDb>>) -> Self {
        Self {
            cpu_usage: DashMap::new(),
            memory_usage: DashMap::new(),
            gpu_usage: DashMap::new(),
            disk_usage: DashMap::new(),
            network_usage: DashMap::new(),
            process_cpu_usage: DashMap::new(),
            process_ram_usage: DashMap::new(),
            process_disk_activity: DashMap::new(),
            process_gpu_usage: DashMap::new(),
            running_processes: DashMap::new(),
            metrics_cache: DashMap::new(),
            metrics_db,
        }
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

    /// Update network usage data
    pub fn update_network(&self, network: NetworkAdapterUsages) {
        self.network_usage.insert("default".to_string(), network);
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
        }
    }

    /// Get static machine data for API response
    pub fn get_static_data(&self) -> GetMachineStaticDataResponse {
        // This would typically be gathered once at startup
        // For now, return a basic response
        GetMachineStaticDataResponse {
            direct_x_version: None,
            cpu: None, // Would be populated from system info
            ram: None,
            gpu: None,
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

    /// Get metrics for a time range (from cache and/or database)
    pub async fn get_metrics(
        &self,
        earliest: DateTime<Utc>,
        latest: DateTime<Utc>,
    ) -> TimeSeriesMachineMetricsResponse {
        // First check cache
        let mut metrics = self.get_metrics_from_cache(earliest, latest);

        // If we have a database and cache doesn't cover the full range, query DB
        if let Some(db) = &self.metrics_db {
            if let Ok(db_metrics) = db.get_metrics_range(earliest, latest).await {
                // Merge with cache results, avoiding duplicates
                let cache_ids: std::collections::HashSet<_> =
                    metrics.iter().map(|m| m.id).collect();
                for m in db_metrics {
                    if !cache_ids.contains(&m.id) {
                        metrics.push(m);
                    }
                }
            }
        }

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
                        // Find any temperature reading that looks like a CPU temp
                        cpu.temperature_readings.iter()
                            .find(|(k, _)| {
                                let lower = k.to_lowercase();
                                lower.contains("cpu") || lower.contains("die") || lower.contains("core")
                            })
                            .map(|(_, v)| v)
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
            disk_usage_data: None,    // TODO: implement
        }
    }
}

impl Default for MachineDataStore {
    fn default() -> Self {
        Self::new(None)
    }
}
