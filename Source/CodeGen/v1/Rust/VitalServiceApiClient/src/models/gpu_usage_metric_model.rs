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
pub struct GpuUsageMetricModel {
    #[serde(rename = "name")]
    pub name: String,
    #[serde(rename = "coreUsagePercentage", skip_serializing_if = "Option::is_none")]
    pub core_usage_percentage: Option<f32>,
    #[serde(rename = "vramUsageBytes", skip_serializing_if = "Option::is_none")]
    pub vram_usage_bytes: Option<f32>,
    #[serde(rename = "vramTotalBytes", skip_serializing_if = "Option::is_none")]
    pub vram_total_bytes: Option<f32>,
    #[serde(rename = "coreTemperature", skip_serializing_if = "Option::is_none")]
    pub core_temperature: Option<f32>,
    #[serde(rename = "powerDrawWattage", skip_serializing_if = "Option::is_none")]
    pub power_draw_wattage: Option<f32>,
    #[serde(rename = "fanPercentage", skip_serializing_if = "Option::is_none")]
    pub fan_percentage: Option<::std::collections::HashMap<String, f32>>,
    #[serde(rename = "id")]
    pub id: i32,
    #[serde(rename = "uniqueIdentifier", skip_serializing_if = "Option::is_none")]
    pub unique_identifier: Option<String>,
}

impl GpuUsageMetricModel {
    pub fn new(name: String, id: i32) -> GpuUsageMetricModel {
        GpuUsageMetricModel {
            name,
            core_usage_percentage: None,
            vram_usage_bytes: None,
            vram_total_bytes: None,
            core_temperature: None,
            power_draw_wattage: None,
            fan_percentage: None,
            id,
            unique_identifier: None,
        }
    }
}


