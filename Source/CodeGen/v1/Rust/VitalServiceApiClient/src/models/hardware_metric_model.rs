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
pub struct HardwareMetricModel {
    #[serde(rename = "id")]
    pub id: i32,
    #[serde(rename = "uniqueIdentifier", skip_serializing_if = "Option::is_none")]
    pub unique_identifier: Option<String>,
}

impl HardwareMetricModel {
    pub fn new(id: i32) -> HardwareMetricModel {
        HardwareMetricModel {
            id,
            unique_identifier: None,
        }
    }
}


