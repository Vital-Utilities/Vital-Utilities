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
pub struct NetworkUsage {
    #[serde(rename = "description")]
    pub description: Option<String>,

    #[serde(rename = "downloadedBps")]
    pub downloaded_bps: f64,

    #[serde(rename = "downloadSpeedBps")]
    pub download_speed_bps: f64,

    #[serde(rename = "macAddress")]
    pub mac_address: String,

    #[serde(rename = "name")]
    pub name: String,

    #[serde(rename = "uploadedBps")]
    pub uploaded_bps: f64,

    #[serde(rename = "uploadSpeedBps")]
    pub upload_speed_bps: f64,

    #[serde(rename = "usagePercentage")]
    pub usage_percentage: f64,
}

#[derive(Serialize, Deserialize)]
pub struct SendProcessMainWindowTitleMappingRequest {
    #[serde(rename = "mappings")]
    pub mappings: Vec<PidProcessTitleMapping>,
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

    #[serde(rename = "diskUsage")]
    pub disk_usage: DiskUsage,

    #[serde(rename = "gpuUtil")]
    pub gpu_util: Option<ProcessGpuUtil>,

    #[serde(rename = "memoryKb")]
    pub memory_kb: f64,

    #[serde(rename = "name")]
    pub name: String,

    #[serde(rename = "parentPid")]
    pub parent_pid: Option<f64>,

    #[serde(rename = "pid")]
    pub pid: f64,

    #[serde(rename = "status")]
    pub status: String,

    #[serde(rename = "timeStamp")]
    pub time_stamp: String,
}

#[derive(Serialize, Deserialize)]
pub struct DiskUsage {
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

    #[serde(rename = "memUsage")]
    pub mem_usage: MemUsage,
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
