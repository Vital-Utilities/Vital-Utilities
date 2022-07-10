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
pub struct RamUsageMetricModel {
    #[serde(rename = "usedMemoryBytes", skip_serializing_if = "Option::is_none")]
    pub used_memory_bytes: Option<f64>,
    #[serde(rename = "totalVisibleMemoryBytes", skip_serializing_if = "Option::is_none")]
    pub total_visible_memory_bytes: Option<f64>,
    #[serde(rename = "id")]
    pub id: i32,
    #[serde(rename = "uniqueIdentifier", skip_serializing_if = "Option::is_none")]
    pub unique_identifier: Option<String>,
}

impl RamUsageMetricModel {
    pub fn new(id: i32) -> RamUsageMetricModel {
        RamUsageMetricModel {
            used_memory_bytes: None,
            total_visible_memory_bytes: None,
            id,
            unique_identifier: None,
        }
    }
}


