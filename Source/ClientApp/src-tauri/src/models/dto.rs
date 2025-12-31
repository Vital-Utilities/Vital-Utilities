//! Data Transfer Objects matching the .NET API contracts for frontend compatibility.
//!
//! These DTOs use camelCase serialization to match the existing API.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// =============================================================================
// Enums
// =============================================================================

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "PascalCase")]
pub enum ProcessPriorityEnum {
    #[default]
    DontOverride,
    Idle,
    BelowNormal,
    Normal,
    AboveNormal,
    High,
    RealTime,
}

impl ProcessPriorityEnum {
    pub fn from_str(s: &str) -> Self {
        match s {
            "DontOverride" => Self::DontOverride,
            "Idle" => Self::Idle,
            "BelowNormal" => Self::BelowNormal,
            "Normal" => Self::Normal,
            "AboveNormal" => Self::AboveNormal,
            "High" => Self::High,
            "RealTime" => Self::RealTime,
            _ => Self::DontOverride,
        }
    }

    pub fn as_str(&self) -> &'static str {
        match self {
            Self::DontOverride => "DontOverride",
            Self::Idle => "Idle",
            Self::BelowNormal => "BelowNormal",
            Self::Normal => "Normal",
            Self::AboveNormal => "AboveNormal",
            Self::High => "High",
            Self::RealTime => "RealTime",
        }
    }
}

// =============================================================================
// Profile DTOs
// =============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProfileDto {
    pub id: i64,
    pub name: String,
    pub managed_models_ids: Vec<i64>,
    pub enabled: bool,
    pub active: bool,
    pub priority: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ManagedModelDto {
    pub id: i64,
    pub process_name: String,
    pub alias: String,
    pub process_priority: ProcessPriorityEnum,
    pub affinity: Vec<i32>,
    pub parent_profile_id: i64,
}

// =============================================================================
// Process DTOs
// =============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProcessViewDto {
    pub process_name: String,
    pub process_title: Option<String>,
    pub description: Option<String>,
    pub id: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProcessToAddDto {
    pub pid: i32,
    pub process_name: String,
    pub main_window_title: String,
    pub execution_path: Option<String>,
    pub can_modify: bool,
    pub affinity: Vec<i32>,
    pub process_priority: ProcessPriorityEnum,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ParentChildModelDto {
    pub parent: ProcessViewDto,
    pub children: HashMap<i32, ProcessViewDto>,
}

// =============================================================================
// Request DTOs
// =============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateProfileRequest {
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateProfileRequest {
    pub profile: ProfileDto,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AddProcessRequest {
    pub process_name: String,
    pub alias: String,
    pub execution_path: String,
    pub process_priority: ProcessPriorityEnum,
    pub affinity: Vec<i32>,
    pub profile_id: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateManagedRequest {
    pub managed_model_dto: ManagedModelDto,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeleteManagedRequest {
    pub process_id: i64,
    pub parent_profile_id: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetMachineTimeSeriesRequest {
    pub earliest: String, // ISO 8601 datetime string
    pub latest: String,   // ISO 8601 datetime string
}

// =============================================================================
// Response DTOs
// =============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetAllResponse {
    pub managed_models: Vec<ManagedModelDto>,
    pub processes_to_add: Vec<ProcessToAddDto>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetManagedResponse {
    pub affinity_models: Vec<ManagedModelDto>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetProcessesToAddResponse {
    pub processes: Vec<ProcessToAddDto>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetRunningProcessesResponse {
    pub process_view: HashMap<i32, ParentChildModelDto>,
}

// =============================================================================
// Hardware Data DTOs
// =============================================================================

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CpuUsage {
    pub name: String,
    pub brand: Option<String>,
    pub vendor_id: Option<String>,
    pub core_clocks_mhz: Vec<i32>,
    pub total_core_percentage: f32,
    pub power_draw_wattage: Option<f32>,
    pub core_percentages: Vec<f32>,
    pub cpu_cache: Option<CpuCache>,
    pub temperature_readings: HashMap<String, f32>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CpuCache {
    pub l1_size: Option<u64>,
    pub l1_line_size: Option<u64>,
    pub l2_size: Option<u64>,
    pub l2_line_size: Option<u64>,
    pub l3_size: Option<u64>,
    pub l3_line_size: Option<u64>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MemoryUsage {
    pub used_memory_bytes: i64,
    pub total_visible_memory_bytes: i64,
    pub swap_percentage: f32,
    pub swap_used_bytes: i64,
    pub swap_total_bytes: i64,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GpuUsage {
    pub name: Option<String>,
    pub temperature_readings: HashMap<String, f32>,
    pub device_index: i32,
    pub part_number: Option<String>,
    pub total_memory_bytes: Option<i64>,
    pub memory_used_bytes: Option<i64>,
    pub clock_speeds: Option<GpuClockSpeeds>,
    pub fan_percentage: Option<HashMap<String, f32>>,
    pub power_draw_watt: Option<i32>,
    pub load: Option<GpuLoadData>,
    pub pcie: Option<PcieThroughput>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GpuClockSpeeds {
    pub memory_clock_mhz: Option<i32>,
    pub compute_clock_mhz: Option<i32>,
    pub graphics_clock_mhz: Option<i32>,
    pub video_clock_mhz: Option<i32>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GpuLoadData {
    pub core_percentage: Option<f32>,
    pub frame_buffer_percentage: Option<f32>,
    pub video_engine_percentage: Option<f32>,
    pub bus_interface_percentage: Option<f32>,
    pub memory_used_percentage: Option<f32>,
    pub memory_controller_percentage: Option<f32>,
    pub cuda_percentage: Option<f32>,
    pub three_d_percentage: Option<f32>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PcieThroughput {
    #[serde(rename = "pCIe_RxBytesPerSecond")]
    pub pcie_rx_bytes_per_second: Option<i64>,
    #[serde(rename = "pCIe_TxBytesPerSecond")]
    pub pcie_tx_bytes_per_second: Option<i64>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiskUsages {
    pub disks: HashMap<String, DiskUsage>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiskUsage {
    pub name: String,
    pub serial: Option<String>,
    pub unique_identifier: Option<String>,
    pub drive_type: Option<String>,
    pub disk_type: Option<String>,
    pub throughput: Option<DiskThroughput>,
    pub load: Option<DiskLoad>,
    pub temperatures: Option<HashMap<String, f32>>,
    pub disk_health: Option<DiskHealth>,
    pub volume_label: Option<String>,
    pub letter: Option<String>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiskLoad {
    pub used_space_percentage: Option<f32>,
    pub used_space_bytes: Option<i64>,
    pub total_space_bytes: Option<i64>,
    pub write_activity_percentage: Option<f32>,
    pub total_activity_percentage: Option<f32>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiskThroughput {
    pub read_rate_bytes_per_second: Option<i64>,
    pub write_rate_bytes_per_second: Option<i64>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiskHealth {
    pub total_bytes_read: Option<u64>,
    pub total_bytes_written: Option<u64>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NetworkAdapterUsages {
    pub adapters: HashMap<String, NetworkAdapterUsage>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NetworkAdapterUsage {
    pub usage: Option<NetAdapterUsage>,
    pub properties: NetworkAdapterProperties,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NetAdapterUsage {
    pub send_bps: i64,
    pub recieve_bps: i64,
    pub usage_percentage: Option<f32>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NetworkAdapterProperties {
    pub ip_interface_properties: IpInterfaceProperties,
    pub is_up: bool,
    pub name: String,
    pub description: Option<String>,
    pub mac_address: Option<String>,
    pub speed_bps: Option<i64>,
    pub connection_type: Option<String>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
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
    /// Current battery power in/out in watts (positive = charging, negative = discharging)
    pub battery_power_watts: Option<f32>,
    /// Battery voltage in volts
    pub battery_voltage: Option<f32>,
    /// Battery current in milliamps (positive = charging, negative = discharging)
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
    /// Adapter wattage
    pub adapter_watts: Option<i32>,
    /// Adapter voltage in volts
    pub adapter_voltage: Option<f32>,
    /// Adapter description (e.g., "pd charger")
    pub adapter_description: Option<String>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IpInterfaceProperties {
    #[serde(rename = "iPv4Address")]
    pub ipv4_address: Option<String>,
    #[serde(rename = "iPv6Address")]
    pub ipv6_address: Option<String>,
    pub dns_suffix: Option<String>,
    pub is_dns_enabled: Option<bool>,
}

// =============================================================================
// Static Hardware Data DTOs
// =============================================================================

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CpuData {
    pub name: String,
    pub number_of_enabled_core: i32,
    pub number_of_cores: i32,
    pub thread_count: i32,
    pub virtualization_firmware_enabled: bool,
    pub l1_cache_size: u64,
    pub l2_cache_size: u64,
    pub l3_cache_size: u64,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RamData {
    pub name: Option<String>,
    pub part_number: Option<String>,
    #[serde(rename = "type")]
    pub ram_type: Option<String>,
    pub speed_mhz: Option<u32>,
    pub slot_number: Option<i32>,
    pub slot_channel: Option<String>,
    pub configured_clock_speed_mhz: Option<u32>,
    pub capacity: Option<f64>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GpuData {
    pub name: String,
    pub memory_total_bytes: Option<i64>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MotherBoardData {
    pub name: Option<String>,
    pub bios: Option<String>,
}

// =============================================================================
// Machine Response DTOs
// =============================================================================

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetMachineDynamicDataResponse {
    pub cpu_usage_data: Option<CpuUsage>,
    pub ram_usages_data: Option<MemoryUsage>,
    pub gpu_usage_data: Option<Vec<GpuUsage>>,
    pub disk_usages: Option<DiskUsages>,
    pub network_usage_data: Option<NetworkAdapterUsages>,
    pub power_usage_data: Option<PowerUsage>,
    pub process_cpu_usage: Option<HashMap<i32, f32>>,
    pub process_cpu_threads_usage: Option<HashMap<i32, f32>>,
    pub process_thread_count: Option<HashMap<i32, f32>>,
    pub process_ram_usage_bytes: Option<HashMap<i32, f32>>,
    pub process_disk_bytes_per_sec_activity: Option<HashMap<i32, f64>>,
    pub cpu_temperature: Option<HashMap<String, f32>>,
    pub process_gpu_usage: Option<HashMap<i32, f32>>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetMachineStaticDataResponse {
    pub direct_x_version: Option<String>,
    pub cpu: Option<CpuData>,
    pub ram: Option<Vec<RamData>>,
    pub gpu: Option<Vec<GpuData>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DateRange {
    pub earliest: String,
    pub latest: String,
}

// =============================================================================
// Utility Functions
// =============================================================================

/// Convert a binary affinity string (e.g., "1111") to an array of core indices
pub fn affinity_binary_to_array(binary: &str) -> Vec<i32> {
    binary
        .chars()
        .rev()
        .enumerate()
        .filter_map(|(i, c)| if c == '1' { Some(i as i32) } else { None })
        .collect()
}

/// Convert an array of core indices to a binary affinity string
pub fn affinity_array_to_binary(cores: &[i32], total_cores: usize) -> String {
    let mut binary = vec!['0'; total_cores];
    for &core in cores {
        if (core as usize) < total_cores {
            binary[total_cores - 1 - core as usize] = '1';
        }
    }
    binary.into_iter().collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_affinity_binary_to_array() {
        assert_eq!(affinity_binary_to_array("1111"), vec![0, 1, 2, 3]);
        assert_eq!(affinity_binary_to_array("1010"), vec![1, 3]);
        assert_eq!(affinity_binary_to_array("0001"), vec![0]);
    }

    #[test]
    fn test_affinity_array_to_binary() {
        assert_eq!(affinity_array_to_binary(&[0, 1, 2, 3], 4), "1111");
        assert_eq!(affinity_array_to_binary(&[1, 3], 4), "1010");
        assert_eq!(affinity_array_to_binary(&[0], 4), "0001");
    }
}
