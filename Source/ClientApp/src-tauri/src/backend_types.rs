use serde::{Deserialize, Serialize}; 
// Example code that deserializes and serializes the model.
// extern crate serde;
// #[macro_use]
// extern crate serde_derive;
// extern crate serde_json;
//
// use generated_module::[object Object];
//
// fn main() {
//     let json = r#"{"answer": 42}"#;
//     let model: [object Object] = serde_json::from_str(&json).unwrap();
// }

extern crate serde_derive;
use std::collections::HashMap;

pub type SettingsClasses = HashMap<String, Option<serde_json::Value>>;

#[derive(Serialize, Deserialize)]
pub struct AddProccessRequest {
    #[serde(rename = "affinity")]
    pub affinity: Vec<f64>,

    #[serde(rename = "alias")]
    pub alias: String,

    #[serde(rename = "executionPath")]
    pub execution_path: String,

    #[serde(rename = "processName")]
    pub process_name: String,

    #[serde(rename = "processPriority")]
    pub process_priority: ProcessPriorityEnum,

    #[serde(rename = "profileId")]
    pub profile_id: f64,
}

#[derive(Serialize, Deserialize)]
pub struct GetAllResponse {
    #[serde(rename = "managedModels")]
    pub managed_models: Vec<ManagedModelDto>,

    #[serde(rename = "processesToAdd")]
    pub processes_to_add: Vec<ProcessToAddDto>,
}

#[derive(Serialize, Deserialize)]
pub struct ManagedModelDto {
    #[serde(rename = "affinity")]
    pub affinity: Vec<f64>,

    #[serde(rename = "alias")]
    pub alias: String,

    #[serde(rename = "executablePath")]
    pub executable_path: String,

    #[serde(rename = "id")]
    pub id: f64,

    #[serde(rename = "parentProfileId")]
    pub parent_profile_id: f64,

    #[serde(rename = "processName")]
    pub process_name: String,

    #[serde(rename = "processPriority")]
    pub process_priority: ProcessPriorityEnum,
}

#[derive(Serialize, Deserialize)]
pub struct ProcessToAddDto {
    #[serde(rename = "affinity")]
    pub affinity: Vec<f64>,

    #[serde(rename = "canModify")]
    pub can_modify: bool,

    #[serde(rename = "executionPath")]
    pub execution_path: Option<String>,

    #[serde(rename = "pid")]
    pub pid: f64,

    #[serde(rename = "processName")]
    pub process_name: String,

    #[serde(rename = "processPriority")]
    pub process_priority: ProcessPriorityEnum,
}

#[derive(Serialize, Deserialize)]
pub struct GetManagedResponse {
    #[serde(rename = "affinityModels")]
    pub affinity_models: Vec<ManagedModelDto>,
}

#[derive(Serialize, Deserialize)]
pub struct GetProcessesToAddResponse {
    #[serde(rename = "processes")]
    pub processes: Vec<ProcessToAddDto>,
}

#[derive(Serialize, Deserialize)]
pub struct GetRunningProcessesResponse {
    #[serde(rename = "processView")]
    pub process_view: Vec<ParentChildModelDto>,
}

#[derive(Serialize, Deserialize)]
pub struct ParentChildModelDto {
    #[serde(rename = "children")]
    pub children: Vec<ProcessViewDto>,

    #[serde(rename = "parent")]
    pub parent: ProcessViewDto,
}

#[derive(Serialize, Deserialize)]
pub struct ProcessViewDto {
    #[serde(rename = "description")]
    pub description: Option<String>,

    #[serde(rename = "id")]
    pub id: f64,

    #[serde(rename = "processName")]
    pub process_name: String,

    #[serde(rename = "processTitle")]
    pub process_title: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct UpdateManagedRequest {
    #[serde(rename = "managedModelDto")]
    pub managed_model_dto: ManagedModelDto,
}

#[derive(Serialize, Deserialize)]
pub struct CreateProfileRequest {
    #[serde(rename = "name")]
    pub name: String,
}

#[derive(Serialize, Deserialize)]
pub struct UpdateProfileRequest {
    #[serde(rename = "profile")]
    pub profile: ProfileDto,
}

#[derive(Serialize, Deserialize)]
pub struct ProfileDto {
    #[serde(rename = "active")]
    pub active: bool,

    #[serde(rename = "enabled")]
    pub enabled: bool,

    #[serde(rename = "id")]
    pub id: f64,

    #[serde(rename = "managedModelsIds")]
    pub managed_models_ids: Vec<f64>,

    #[serde(rename = "name")]
    pub name: String,

    #[serde(rename = "priority")]
    pub priority: Option<f64>,
}

#[derive(Serialize, Deserialize)]
pub struct SettingsDto {
    #[serde(rename = "influxDb")]
    pub influx_db: InfluxDbSettings,

    #[serde(rename = "launch")]
    pub launch: LaunchSettings,

    #[serde(rename = "metrics")]
    pub metrics: MetricsSettings,

    #[serde(rename = "runAtStarup")]
    pub run_at_starup: Option<bool>,
}

#[derive(Serialize, Deserialize)]
pub struct InfluxDbSettings {
    #[serde(rename = "enabled")]
    pub enabled: bool,

    #[serde(rename = "endPoint")]
    pub end_point: String,

    #[serde(rename = "reportIntervalSeconds")]
    pub report_interval_seconds: f64,

    #[serde(rename = "token")]
    pub token: String,
}

#[derive(Serialize, Deserialize)]
pub struct LaunchSettings {
    #[serde(rename = "vitalServiceHttpsPort")]
    pub vital_service_https_port: f64,
}

#[derive(Serialize, Deserialize)]
pub struct MetricsSettings {
    #[serde(rename = "persistMetrics")]
    pub persist_metrics: bool,
}

#[derive(Serialize, Deserialize)]
pub struct HardwareMetricModel {
    #[serde(rename = "id")]
    pub id: f64,

    #[serde(rename = "uniqueIdentifier")]
    pub unique_identifier: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct GetMachineDynamicDataResponse {
    #[serde(rename = "cpuTemperature")]
    pub cpu_temperature: Option<HashMap<String, f64>>,

    #[serde(rename = "cpuUsageData")]
    pub cpu_usage_data: Option<CpuUsages>,

    #[serde(rename = "diskUsages")]
    pub disk_usages: Option<DiskUsages>,

    #[serde(rename = "gpuUsageData")]
    pub gpu_usage_data: Option<Vec<GpuUsages>>,

    #[serde(rename = "networkUsageData")]
    pub network_usage_data: Option<NetworkAdapters>,

    #[serde(rename = "processCpuThreadsUsage")]
    pub process_cpu_threads_usage: Option<Vec<f64>>,

    #[serde(rename = "processCpuUsage")]
    pub process_cpu_usage: Option<Vec<f64>>,

    #[serde(rename = "processDiskBytesPerSecActivity")]
    pub process_disk_bytes_per_sec_activity: Option<Vec<f64>>,

    #[serde(rename = "processRamUsageGb")]
    pub process_ram_usage_gb: Option<Vec<f64>>,

    #[serde(rename = "processThreadCount")]
    pub process_thread_count: Option<Vec<f64>>,

    #[serde(rename = "ramUsagesData")]
    pub ram_usages_data: Option<RamUsages>,
}

#[derive(Serialize, Deserialize)]
pub struct CpuUsages {
    #[serde(rename = "coreClocksMhz")]
    pub core_clocks_mhz: Vec<f64>,

    #[serde(rename = "cores")]
    pub cores: Vec<f64>,

    #[serde(rename = "powerDrawWattage")]
    pub power_draw_wattage: Option<f64>,

    #[serde(rename = "temperatureReadings")]
    pub temperature_readings: HashMap<String, f64>,

    #[serde(rename = "total")]
    pub total: f64,
}

#[derive(Serialize, Deserialize)]
pub struct DiskUsages {
    #[serde(rename = "disks")]
    pub disks: HashMap<String, Usage>,
}

#[derive(Serialize, Deserialize)]
pub struct Usage {
    #[serde(rename = "data")]
    pub data: Data,

    #[serde(rename = "downloadedBps")]
    pub downloaded_bps: f64,

    #[serde(rename = "downloadSpeedBps")]
    pub download_speed_bps: f64,

    #[serde(rename = "driveType")]
    pub drive_type: Option<DriveType>,

    #[serde(rename = "label")]
    pub label: String,

    #[serde(rename = "letter")]
    pub letter: String,

    #[serde(rename = "load")]
    pub load: Load,

    #[serde(rename = "name")]
    pub name: String,

    #[serde(rename = "serial")]
    pub serial: Option<String>,

    #[serde(rename = "temperatures")]
    pub temperatures: HashMap<String, f64>,

    #[serde(rename = "throughput")]
    pub throughput: Throughput,

    #[serde(rename = "uniqueIdentifier")]
    pub unique_identifier: Option<String>,

    #[serde(rename = "uploadedBps")]
    pub uploaded_bps: f64,

    #[serde(rename = "uploadSpeedBps")]
    pub upload_speed_bps: f64,

    #[serde(rename = "usagePercentage")]
    pub usage_percentage: f64,
}

#[derive(Serialize, Deserialize)]
pub struct Data {
    #[serde(rename = "dataReadBytes")]
    pub data_read_bytes: Option<f64>,

    #[serde(rename = "dataWrittenBytes")]
    pub data_written_bytes: Option<f64>,
}

#[derive(Serialize, Deserialize)]
pub struct Load {
    #[serde(rename = "totalActivityPercentage")]
    pub total_activity_percentage: Option<f64>,

    #[serde(rename = "totalFreeSpaceBytes")]
    pub total_free_space_bytes: Option<f64>,

    #[serde(rename = "usedSpaceBytes")]
    pub used_space_bytes: Option<f64>,

    #[serde(rename = "usedSpacePercentage")]
    pub used_space_percentage: Option<f64>,

    #[serde(rename = "writeActivityPercentage")]
    pub write_activity_percentage: Option<f64>,
}

#[derive(Serialize, Deserialize)]
pub struct Throughput {
    #[serde(rename = "readRateBytesPerSecond")]
    pub read_rate_bytes_per_second: Option<f64>,

    #[serde(rename = "writeRateBytesPerSecond")]
    pub write_rate_bytes_per_second: Option<f64>,
}

#[derive(Serialize, Deserialize)]
pub struct GpuUsages {
    #[serde(rename = "coreClockMhz")]
    pub core_clock_mhz: Option<f64>,

    #[serde(rename = "fanPercentage")]
    pub fan_percentage: Option<HashMap<String, f64>>,

    #[serde(rename = "load")]
    pub load: LoadData,

    #[serde(rename = "memoryClockMhz")]
    pub memory_clock_mhz: Option<f64>,

    #[serde(rename = "memoryUsedBytes")]
    pub memory_used_bytes: Option<f64>,

    #[serde(rename = "pcIe_Throughput")]
    pub pc_ie_throughput: PcieThroughPut,

    #[serde(rename = "powerDraw")]
    pub power_draw: Option<f64>,

    #[serde(rename = "shaderClockMhz")]
    pub shader_clock_mhz: Option<f64>,

    #[serde(rename = "temperatureReadings")]
    pub temperature_readings: HashMap<String, f64>,

    #[serde(rename = "totalMemoryBytes")]
    pub total_memory_bytes: Option<f64>,
}

#[derive(Serialize, Deserialize)]
pub struct LoadData {
    #[serde(rename = "busInterface")]
    pub bus_interface: Option<f64>,

    #[serde(rename = "core")]
    pub core: Option<f64>,

    #[serde(rename = "cuda")]
    pub cuda: Option<f64>,

    #[serde(rename = "frameBuffer")]
    pub frame_buffer: Option<f64>,

    #[serde(rename = "memory")]
    pub memory: Option<f64>,

    #[serde(rename = "memoryController")]
    pub memory_controller: Option<f64>,

    #[serde(rename = "threeD")]
    pub three_d: Option<f64>,

    #[serde(rename = "videoEngine")]
    pub video_engine: Option<f64>,
}

#[derive(Serialize, Deserialize)]
pub struct PcieThroughPut {
    #[serde(rename = "pcIe_Rx_BytesPerSecond")]
    pub pc_ie_rx_bytes_per_second: Option<f64>,

    #[serde(rename = "pcIe_Tx_BytesPerSecond")]
    pub pc_ie_tx_bytes_per_second: Option<f64>,
}

#[derive(Serialize, Deserialize)]
pub struct NetworkAdapters {
    #[serde(rename = "adapters")]
    pub adapters: HashMap<String, NetworkAdapter>,
}

#[derive(Serialize, Deserialize)]
pub struct NetworkAdapter {
    #[serde(rename = "properties")]
    pub properties: Properties,

    #[serde(rename = "usage")]
    pub usage: Usage,
}

#[derive(Serialize, Deserialize)]
pub struct Properties {
    #[serde(rename = "connectionType")]
    pub connection_type: String,

    #[serde(rename = "description")]
    pub description: Option<String>,

    #[serde(rename = "ipInterfaceProperties")]
    pub ip_interface_properties: IpInterfaceProperties,

    #[serde(rename = "macAddress")]
    pub mac_address: String,

    #[serde(rename = "name")]
    pub name: String,

    #[serde(rename = "speedBps")]
    pub speed_bps: f64,
}

#[derive(Serialize, Deserialize)]
pub struct IpInterfaceProperties {
    #[serde(rename = "dnsSuffix")]
    pub dns_suffix: Option<String>,

    #[serde(rename = "iPv4Address")]
    pub i_pv4_address: Option<String>,

    #[serde(rename = "iPv6Address")]
    pub i_pv6_address: Option<String>,

    #[serde(rename = "isDnsEnabled")]
    pub is_dns_enabled: bool,
}

#[derive(Serialize, Deserialize)]
pub struct RamUsages {
    #[serde(rename = "totalVisibleMemoryBytes")]
    pub total_visible_memory_bytes: f64,

    #[serde(rename = "usedMemoryBytes")]
    pub used_memory_bytes: f64,
}

#[derive(Serialize, Deserialize)]
pub struct GetMachineTimeSeriesRequest {
    #[serde(rename = "from")]
    pub from: String,

    #[serde(rename = "to")]
    pub to: String,
}

#[derive(Serialize, Deserialize)]
pub struct GetMachineRelativeTimeSeriesRequest {
    #[serde(rename = "from")]
    pub from: String,

    #[serde(rename = "to")]
    pub to: To,
}

#[derive(Serialize, Deserialize)]
pub struct To {
    #[serde(rename = "days")]
    pub days: Option<f64>,

    #[serde(rename = "hours")]
    pub hours: Option<f64>,

    #[serde(rename = "minutes")]
    pub minutes: Option<f64>,

    #[serde(rename = "months")]
    pub months: Option<f64>,
}

#[derive(Serialize, Deserialize)]
pub struct GetMachineStaticDataResponse {
    #[serde(rename = "cpu")]
    pub cpu: CpuData,

    #[serde(rename = "directXVersion")]
    pub direct_x_version: Option<String>,

    #[serde(rename = "gpu")]
    pub gpu: Vec<GpuData>,

    #[serde(rename = "ram")]
    pub ram: Vec<RamData>,
}

#[derive(Serialize, Deserialize)]
pub struct CpuData {
    #[serde(rename = "l1CacheSize")]
    pub l1_cache_size: f64,

    #[serde(rename = "l2CacheSize")]
    pub l2_cache_size: f64,

    #[serde(rename = "l3CacheSize")]
    pub l3_cache_size: f64,

    #[serde(rename = "name")]
    pub name: String,

    #[serde(rename = "numberOfCores")]
    pub number_of_cores: f64,

    #[serde(rename = "numberOfEnabledCore")]
    pub number_of_enabled_core: f64,

    #[serde(rename = "threadCount")]
    pub thread_count: f64,

    #[serde(rename = "virtualizationFirmwareEnabled")]
    pub virtualization_firmware_enabled: bool,
}

#[derive(Serialize, Deserialize)]
pub struct GpuData {
    #[serde(rename = "memoryTotalBytes")]
    pub memory_total_bytes: Option<f64>,

    #[serde(rename = "name")]
    pub name: String,
}

#[derive(Serialize, Deserialize)]
pub struct RamData {
    #[serde(rename = "capacity")]
    pub capacity: Option<f64>,

    #[serde(rename = "configuredClockSpeedMhz")]
    pub configured_clock_speed_mhz: Option<f64>,

    #[serde(rename = "name")]
    pub name: Option<String>,

    #[serde(rename = "partNumber")]
    pub part_number: Option<String>,

    #[serde(rename = "slotChannel")]
    pub slot_channel: Option<String>,

    #[serde(rename = "slotNumber")]
    pub slot_number: Option<f64>,

    #[serde(rename = "speedMhz")]
    pub speed_mhz: Option<f64>,

    #[serde(rename = "type")]
    pub ram_data_type: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct TimeSeriesMachineMetricsResponse {
    #[serde(rename = "metrics")]
    pub metrics: Vec<TimeSeriesMachineMetricsModel>,

    #[serde(rename = "requestRange")]
    pub request_range: DateRange,
}

#[derive(Serialize, Deserialize)]
pub struct TimeSeriesMachineMetricsModel {
    #[serde(rename = "cpuUsageData")]
    pub cpu_usage_data: Vec<CpuUsageMetricModel>,

    #[serde(rename = "dateTimeOffset")]
    pub date_time_offset: String,

    #[serde(rename = "diskUsageData")]
    pub disk_usage_data: Vec<DiskUsageMetricModel>,

    #[serde(rename = "gpuUsageData")]
    pub gpu_usage_data: Vec<GpuUsageMetricModel>,

    #[serde(rename = "id")]
    pub id: f64,

    #[serde(rename = "networkUsageData")]
    pub network_usage_data: Vec<NetworkUsageMetricModel>,

    #[serde(rename = "ramUsageData")]
    pub ram_usage_data: RamUsageMetricModel,
}

#[derive(Serialize, Deserialize)]
pub struct CpuUsageMetricModel {
    #[serde(rename = "coreClocksMhz")]
    pub core_clocks_mhz: Option<Vec<f64>>,

    #[serde(rename = "coresUsagePercentage")]
    pub cores_usage_percentage: Option<Vec<f64>>,

    #[serde(rename = "id")]
    pub id: f64,

    #[serde(rename = "packageTemperature")]
    pub package_temperature: Option<f64>,

    #[serde(rename = "powerDrawWattage")]
    pub power_draw_wattage: Option<f64>,

    #[serde(rename = "totalCoreUsagePercentage")]
    pub total_core_usage_percentage: Option<f64>,

    #[serde(rename = "uniqueIdentifier")]
    pub unique_identifier: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct DiskUsageMetricModel {
    #[serde(rename = "dataReadBytes")]
    pub data_read_bytes: Option<f64>,

    #[serde(rename = "dataWrittenBytes")]
    pub data_written_bytes: Option<f64>,

    #[serde(rename = "driveLetter")]
    pub drive_letter: Option<String>,

    #[serde(rename = "driveType")]
    pub drive_type: Option<DriveType>,

    #[serde(rename = "id")]
    pub id: f64,

    #[serde(rename = "name")]
    pub name: Option<String>,

    #[serde(rename = "readRateBytesPerSecond")]
    pub read_rate_bytes_per_second: Option<f64>,

    #[serde(rename = "serial")]
    pub serial: Option<String>,

    #[serde(rename = "temperatures")]
    pub temperatures: Option<HashMap<String, f64>>,

    #[serde(rename = "totalActivityPercentage")]
    pub total_activity_percentage: Option<f64>,

    #[serde(rename = "uniqueIdentifier")]
    pub unique_identifier: Option<String>,

    #[serde(rename = "usedSpaceBytes")]
    pub used_space_bytes: Option<f64>,

    #[serde(rename = "usedSpacePercentage")]
    pub used_space_percentage: Option<f64>,

    #[serde(rename = "writeActivityPercentage")]
    pub write_activity_percentage: Option<f64>,

    #[serde(rename = "writeRateBytesPerSecond")]
    pub write_rate_bytes_per_second: Option<f64>,
}

#[derive(Serialize, Deserialize)]
pub struct GpuUsageMetricModel {
    #[serde(rename = "coreTemperature")]
    pub core_temperature: Option<f64>,

    #[serde(rename = "coreUsagePercentage")]
    pub core_usage_percentage: Option<f64>,

    #[serde(rename = "fanPercentage")]
    pub fan_percentage: Option<HashMap<String, f64>>,

    #[serde(rename = "id")]
    pub id: f64,

    #[serde(rename = "powerDrawWattage")]
    pub power_draw_wattage: Option<f64>,

    #[serde(rename = "uniqueIdentifier")]
    pub unique_identifier: Option<String>,

    #[serde(rename = "vramTotalBytes")]
    pub vram_total_bytes: Option<f64>,

    #[serde(rename = "vramUsageBytes")]
    pub vram_usage_bytes: Option<f64>,
}

#[derive(Serialize, Deserialize)]
pub struct NetworkUsageMetricModel {
    #[serde(rename = "downloadSpeedBps")]
    pub download_speed_bps: Option<f64>,

    #[serde(rename = "id")]
    pub id: f64,

    #[serde(rename = "uniqueIdentifier")]
    pub unique_identifier: Option<String>,

    #[serde(rename = "uploadSpeedBps")]
    pub upload_speed_bps: Option<f64>,
}

#[derive(Serialize, Deserialize)]
pub struct RamUsageMetricModel {
    #[serde(rename = "id")]
    pub id: f64,

    #[serde(rename = "totalVisibleMemoryBytes")]
    pub total_visible_memory_bytes: Option<f64>,

    #[serde(rename = "uniqueIdentifier")]
    pub unique_identifier: Option<String>,

    #[serde(rename = "usedMemoryBytes")]
    pub used_memory_bytes: Option<f64>,
}

#[derive(Serialize, Deserialize)]
pub struct DateRange {
    #[serde(rename = "earliest")]
    pub earliest: String,

    #[serde(rename = "latest")]
    pub latest: String,
}

#[derive(Serialize, Deserialize)]
pub struct MotherBoardData {
    #[serde(rename = "bios")]
    pub bios: Option<String>,

    #[serde(rename = "name")]
    pub name: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct DeleteManagedRequest {
    #[serde(rename = "parentProfileId")]
    pub parent_profile_id: f64,

    #[serde(rename = "processId")]
    pub process_id: f64,
}

#[derive(Serialize, Deserialize)]
pub enum ProcessPriorityEnum {
    #[serde(rename = "AboveNormal")]
    AboveNormal,

    #[serde(rename = "BelowNormal")]
    BelowNormal,

    #[serde(rename = "DontOverride")]
    DontOverride,

    #[serde(rename = "High")]
    High,

    #[serde(rename = "Idle")]
    Idle,

    #[serde(rename = "Normal")]
    Normal,

    #[serde(rename = "RealTime")]
    RealTime,
}

#[derive(Serialize, Deserialize)]
pub enum DriveType {
    #[serde(rename = "CDRom")]
    CdRom,

    #[serde(rename = "Fixed")]
    Fixed,

    #[serde(rename = "Network")]
    Network,

    #[serde(rename = "NoRootDirectory")]
    NoRootDirectory,

    #[serde(rename = "Ram")]
    Ram,

    #[serde(rename = "Removable")]
    Removable,

    #[serde(rename = "Unknown")]
    Unknown,
}
