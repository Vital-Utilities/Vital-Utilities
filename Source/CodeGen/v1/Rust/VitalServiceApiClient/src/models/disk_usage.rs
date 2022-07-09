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
pub struct DiskUsage {
    #[serde(rename = "name")]
    pub name: String,
    #[serde(rename = "serial")]
    pub serial: Option<String>,
    #[serde(rename = "uniqueIdentifier")]
    pub unique_identifier: Option<String>,
    #[serde(rename = "driveType")]
    pub drive_type: crate::models::DriveType,
    #[serde(rename = "diskType")]
    pub disk_type: crate::models::DiskType,
    #[serde(rename = "throughput")]
    pub throughput: Box<crate::models::Throughput>,
    #[serde(rename = "load")]
    pub load: Box<crate::models::DiskLoad>,
    #[serde(rename = "temperatures")]
    pub temperatures: ::std::collections::HashMap<String, f32>,
    #[serde(rename = "diskHealth")]
    pub disk_health: Box<crate::models::DiskHealth>,
    #[serde(rename = "label")]
    pub label: String,
    #[serde(rename = "letter")]
    pub letter: Option<String>,
}

impl DiskUsage {
    pub fn new(name: String, serial: Option<String>, unique_identifier: Option<String>, drive_type: crate::models::DriveType, disk_type: crate::models::DiskType, throughput: crate::models::Throughput, load: crate::models::DiskLoad, temperatures: ::std::collections::HashMap<String, f32>, disk_health: crate::models::DiskHealth, label: String, letter: Option<String>) -> DiskUsage {
        DiskUsage {
            name,
            serial,
            unique_identifier,
            drive_type,
            disk_type,
            throughput: Box::new(throughput),
            load: Box::new(load),
            temperatures,
            disk_health: Box::new(disk_health),
            label,
            letter,
        }
    }
}


