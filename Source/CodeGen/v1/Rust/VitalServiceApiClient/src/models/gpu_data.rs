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
pub struct GpuData {
    #[serde(rename = "name")]
    pub name: String,
    #[serde(rename = "memoryTotalBytes", skip_serializing_if = "Option::is_none")]
    pub memory_total_bytes: Option<i64>,
}

impl GpuData {
    pub fn new(name: String) -> GpuData {
        GpuData {
            name,
            memory_total_bytes: None,
        }
    }
}


