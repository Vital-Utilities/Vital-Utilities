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

#[derive(Serialize, Deserialize)]
pub struct GpuUsage {
    #[serde(rename = "coreClockMhz")]
    pub core_clock_mhz: f64,

    #[serde(rename = "corePercentage")]
    pub core_percentage: f64,

    #[serde(rename = "corePowerWatt")]
    pub core_power_watt: f64,

    #[serde(rename = "memClockMhz")]
    pub mem_clock_mhz: f64,

    #[serde(rename = "memPercentage")]
    pub mem_percentage: f64,

    #[serde(rename = "memTotalKB")]
    pub mem_total_kb: f64,

    #[serde(rename = "name")]
    pub name: String,

    #[serde(rename = "pciThroughputRecieveKBs")]
    pub pci_throughput_recieve_k_bs: f64,

    #[serde(rename = "pciThroughputSendKBs")]
    pub pci_throughput_send_k_bs: f64,
}

#[derive(Serialize, Deserialize)]
pub struct PidProcessTitleMapping {
    #[serde(rename = "id")]
    pub id: f64,

    #[serde(rename = "title")]
    pub title: String,
}

#[derive(Serialize, Deserialize)]
pub struct SendUtilizationRequest {
    #[serde(rename = "processData")]
    pub process_data: Vec<ProcessData>,

    #[serde(rename = "systemUsage")]
    pub system_usage: SystemUsage,
}

#[derive(Serialize, Deserialize)]
pub struct ProcessData {
    #[serde(rename = "cpuPercentage")]
    pub cpu_percentage: f64,

    #[serde(rename = "description")]
    pub description: Option<String>,

    #[serde(rename = "diskUsage")]
    pub disk_usage: ProcessDiskUsage,

    #[serde(rename = "executablePath")]
    pub executable_path: Option<String>,

    #[serde(rename = "gpuUtil")]
    pub gpu_util: Option<ProcessGpuUtil>,

    #[serde(rename = "mainWindowTitle")]
    pub main_window_title: Option<String>,

    #[serde(rename = "memoryKb")]
    pub memory_kb: f64,

    #[serde(rename = "name")]
    pub name: String,

    #[serde(rename = "parentPid")]
    pub parent_pid: Option<f64>,

    #[serde(rename = "pid")]
    pub pid: f64,

    #[serde(rename = "status")]
    pub status: Option<String>,

    #[serde(rename = "timeStamp")]
    pub time_stamp: String,
}

#[derive(Serialize, Deserialize)]
pub struct ProcessDiskUsage {
    #[serde(rename = "readBytesPerSecond")]
    pub read_bytes_per_second: f64,

    #[serde(rename = "writeBytesPerSecond")]
    pub write_bytes_per_second: f64,
}

#[derive(Serialize, Deserialize)]
pub struct ProcessGpuUtil {
    #[serde(rename = "gpuCorePercentage")]
    pub gpu_core_percentage: Option<f64>,

    #[serde(rename = "gpuDecodingPercentage")]
    pub gpu_decoding_percentage: Option<f64>,

    #[serde(rename = "gpuEncodingPercentage")]
    pub gpu_encoding_percentage: Option<f64>,

    #[serde(rename = "gpuMemPercentage")]
    pub gpu_mem_percentage: Option<f64>,
}

#[derive(Serialize, Deserialize)]
pub struct SystemUsage {
    #[serde(rename = "cpuUsage")]
    pub cpu_usage: CpuUsage,

    #[serde(rename = "disk")]
    pub disk: HashMap<String, Disk>,

    #[serde(rename = "memUsage")]
    pub mem_usage: MemUsage,

    #[serde(rename = "networkAdapterUsage")]
    pub network_adapter_usage: Vec<NetworkAdapterUsage>,
}

#[derive(Serialize, Deserialize)]
pub struct CpuUsage {
    #[serde(rename = "coreFrequencies")]
    pub core_frequencies: Vec<f64>,

    #[serde(rename = "corePercentages")]
    pub core_percentages: Vec<f64>,

    #[serde(rename = "cpuPercentage")]
    pub cpu_percentage: f64,

    #[serde(rename = "cpuTemp")]
    pub cpu_temp: f64,
}

#[derive(Serialize, Deserialize)]
pub struct Disk {
    #[serde(rename = "diskType")]
    pub disk_type: Option<DiskType>,

    #[serde(rename = "health")]
    pub health: Option<DiskHealth>,

    #[serde(rename = "letter")]
    pub letter: Option<String>,

    #[serde(rename = "load")]
    pub load: Option<DiskLoad>,

    #[serde(rename = "name")]
    pub name: String,

    #[serde(rename = "serial")]
    pub serial: Option<String>,

    #[serde(rename = "temperatures")]
    pub temperatures: Option<HashMap<String, f64>>,

    #[serde(rename = "throughput")]
    pub throughput: Option<DiskThroughput>,
}

#[derive(Serialize, Deserialize)]
pub struct DiskHealth {
    #[serde(rename = "totalBytesRead")]
    pub total_bytes_read: Option<f64>,

    #[serde(rename = "totalBytesWritten")]
    pub total_bytes_written: Option<f64>,
}

#[derive(Serialize, Deserialize)]
pub struct DiskLoad {
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
pub struct DiskThroughput {
    #[serde(rename = "readRateBytesPerSecond")]
    pub read_rate_bytes_per_second: Option<f64>,

    #[serde(rename = "writeRateBytesPerSecond")]
    pub write_rate_bytes_per_second: Option<f64>,
}

#[derive(Serialize, Deserialize)]
pub struct MemUsage {
    #[serde(rename = "memPercentage")]
    pub mem_percentage: f64,

    #[serde(rename = "memTotalKB")]
    pub mem_total_kb: f64,

    #[serde(rename = "memUsedKB")]
    pub mem_used_kb: f64,

    #[serde(rename = "swapPercentage")]
    pub swap_percentage: f64,

    #[serde(rename = "swapTotalKB")]
    pub swap_total_kb: f64,

    #[serde(rename = "swapUsedKB")]
    pub swap_used_kb: f64,
}

#[derive(Serialize, Deserialize)]
pub struct NetworkAdapterUsage {
    #[serde(rename = "properties")]
    pub properties: NetworkAdapterProperties,

    #[serde(rename = "utilisation")]
    pub utilisation: Option<NetworkAdapterUtil>,
}

#[derive(Serialize, Deserialize)]
pub struct NetworkAdapterProperties {
    #[serde(rename = "connectionType")]
    pub connection_type: Option<String>,

    #[serde(rename = "description")]
    pub description: Option<String>,

    #[serde(rename = "dnsSuffix")]
    pub dns_suffix: Option<String>,

    #[serde(rename = "iPv4Address")]
    pub i_pv4_address: Option<Vec<String>>,

    #[serde(rename = "iPv6Address")]
    pub i_pv6_address: Option<Vec<String>>,

    #[serde(rename = "macAddress")]
    pub mac_address: String,

    #[serde(rename = "name")]
    pub name: String,

    #[serde(rename = "speedBps")]
    pub speed_bps: Option<f64>,
}

#[derive(Serialize, Deserialize)]
pub struct NetworkAdapterUtil {
    #[serde(rename = "recieveBps")]
    pub recieve_bps: f64,

    #[serde(rename = "sendBps")]
    pub send_bps: f64,
}

#[derive(Serialize, Deserialize)]
pub enum DiskType {
    #[serde(rename = "HDD")]
    Hdd,

    #[serde(rename = "SSD")]
    Ssd,

    #[serde(rename = "Unknown")]
    Unknown,
}
