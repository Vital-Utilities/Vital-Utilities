/*
 * VitalService
 *
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: 1.0
 * 
 * Generated by: https://openapi-generator.tech
 */




#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct ProcessData {
    #[serde(rename = "pid")]
    pub pid: i32,
    #[serde(rename = "parentPid", skip_serializing_if = "Option::is_none")]
    pub parent_pid: Option<i32>,
    #[serde(rename = "executablePath", skip_serializing_if = "Option::is_none")]
    pub executable_path: Option<String>,
    #[serde(rename = "description", skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(rename = "mainWindowTitle", skip_serializing_if = "Option::is_none")]
    pub main_window_title: Option<String>,
    #[serde(rename = "name")]
    pub name: String,
    #[serde(rename = "timeStamp")]
    pub time_stamp: String,
    #[serde(rename = "cpuPercentage")]
    pub cpu_percentage: f32,
    #[serde(rename = "memoryBytes")]
    pub memory_bytes: i64,
    #[serde(rename = "diskUsage")]
    pub disk_usage: Box<crate::models::ProcessDiskUsage>,
    #[serde(rename = "status", skip_serializing_if = "Option::is_none")]
    pub status: Option<String>,
    #[serde(rename = "gpuUtil", skip_serializing_if = "Option::is_none")]
    pub gpu_util: Option<Box<crate::models::ProcessGpuUtil>>,
}

impl ProcessData {
    pub fn new(pid: i32, name: String, time_stamp: String, cpu_percentage: f32, memory_bytes: i64, disk_usage: crate::models::ProcessDiskUsage) -> ProcessData {
        ProcessData {
            pid,
            parent_pid: None,
            executable_path: None,
            description: None,
            main_window_title: None,
            name,
            time_stamp,
            cpu_percentage,
            memory_bytes,
            disk_usage: Box::new(disk_usage),
            status: None,
            gpu_util: None,
        }
    }
}


