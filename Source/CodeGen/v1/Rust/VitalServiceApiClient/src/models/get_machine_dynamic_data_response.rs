/*
 * VitalService
 *
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: 1.0
 * 
 * Generated by: https://openapi-generator.tech
 */




#[derive(Clone, Debug, PartialEq, Default, Serialize, Deserialize)]
pub struct GetMachineDynamicDataResponse {
    #[serde(rename = "cpuUsageData", skip_serializing_if = "Option::is_none")]
    pub cpu_usage_data: Option<Box<crate::models::CpuUsage>>,
    #[serde(rename = "ramUsagesData", skip_serializing_if = "Option::is_none")]
    pub ram_usages_data: Option<Box<crate::models::MemoryUsage>>,
    #[serde(rename = "gpuUsageData", skip_serializing_if = "Option::is_none")]
    pub gpu_usage_data: Option<Vec<crate::models::GpuUsage>>,
    #[serde(rename = "diskUsages", skip_serializing_if = "Option::is_none")]
    pub disk_usages: Option<Box<crate::models::DiskUsages>>,
    #[serde(rename = "networkUsageData", skip_serializing_if = "Option::is_none")]
    pub network_usage_data: Option<Box<crate::models::NetworkAdapterUsages>>,
    #[serde(rename = "processCpuUsage", skip_serializing_if = "Option::is_none")]
    pub process_cpu_usage: Option<::std::collections::HashMap<String, f32>>,
    #[serde(rename = "processCpuThreadsUsage", skip_serializing_if = "Option::is_none")]
    pub process_cpu_threads_usage: Option<::std::collections::HashMap<String, f32>>,
    #[serde(rename = "processThreadCount", skip_serializing_if = "Option::is_none")]
    pub process_thread_count: Option<::std::collections::HashMap<String, f32>>,
    #[serde(rename = "processRamUsageBytes", skip_serializing_if = "Option::is_none")]
    pub process_ram_usage_bytes: Option<::std::collections::HashMap<String, f32>>,
    #[serde(rename = "processDiskBytesPerSecActivity", skip_serializing_if = "Option::is_none")]
    pub process_disk_bytes_per_sec_activity: Option<::std::collections::HashMap<String, f64>>,
    #[serde(rename = "cpuTemperature", skip_serializing_if = "Option::is_none")]
    pub cpu_temperature: Option<::std::collections::HashMap<String, f32>>,
    #[serde(rename = "processGpuUsage", skip_serializing_if = "Option::is_none")]
    pub process_gpu_usage: Option<::std::collections::HashMap<String, f32>>,
}

impl GetMachineDynamicDataResponse {
    pub fn new() -> GetMachineDynamicDataResponse {
        GetMachineDynamicDataResponse {
            cpu_usage_data: None,
            ram_usages_data: None,
            gpu_usage_data: None,
            disk_usages: None,
            network_usage_data: None,
            process_cpu_usage: None,
            process_cpu_threads_usage: None,
            process_thread_count: None,
            process_ram_usage_bytes: None,
            process_disk_bytes_per_sec_activity: None,
            cpu_temperature: None,
            process_gpu_usage: None,
        }
    }
}


