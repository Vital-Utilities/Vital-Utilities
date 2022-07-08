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
pub struct ProcessData {
    #[serde(rename = "pid", skip_serializing_if = "Option::is_none")]
    pub pid: Option<f32>,
    #[serde(rename = "parentPid", skip_serializing_if = "Option::is_none")]
    pub parent_pid: Option<f32>,
    #[serde(rename = "executablePath", skip_serializing_if = "Option::is_none")]
    pub executable_path: Option<String>,
    #[serde(rename = "description", skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(rename = "mainWindowTitle", skip_serializing_if = "Option::is_none")]
    pub main_window_title: Option<String>,
    #[serde(rename = "name", skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    #[serde(rename = "timeStamp", skip_serializing_if = "Option::is_none")]
    pub time_stamp: Option<String>,
    #[serde(rename = "cpuPercentage", skip_serializing_if = "Option::is_none")]
    pub cpu_percentage: Option<f32>,
    #[serde(rename = "memoryKb", skip_serializing_if = "Option::is_none")]
    pub memory_kb: Option<f32>,
    #[serde(rename = "diskUsage", skip_serializing_if = "Option::is_none")]
    pub disk_usage: Option<Box<crate::models::ProcessDiskUsage>>,
    #[serde(rename = "status", skip_serializing_if = "Option::is_none")]
    pub status: Option<String>,
    #[serde(rename = "gpuUtil", skip_serializing_if = "Option::is_none")]
    pub gpu_util: Option<Box<crate::models::ProcessGpuUtil>>,
}

impl ProcessData {
    pub fn new() -> ProcessData {
        ProcessData {
            pid: None,
            parent_pid: None,
            executable_path: None,
            description: None,
            main_window_title: None,
            name: None,
            time_stamp: None,
            cpu_percentage: None,
            memory_kb: None,
            disk_usage: None,
            status: None,
            gpu_util: None,
        }
    }
}


