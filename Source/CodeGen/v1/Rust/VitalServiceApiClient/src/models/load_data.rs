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
pub struct LoadData {
    #[serde(rename = "core", skip_serializing_if = "Option::is_none")]
    pub core: Option<f32>,
    #[serde(rename = "frameBuffer", skip_serializing_if = "Option::is_none")]
    pub frame_buffer: Option<f32>,
    #[serde(rename = "videoEngine", skip_serializing_if = "Option::is_none")]
    pub video_engine: Option<f32>,
    #[serde(rename = "busInterface", skip_serializing_if = "Option::is_none")]
    pub bus_interface: Option<f32>,
    #[serde(rename = "memory", skip_serializing_if = "Option::is_none")]
    pub memory: Option<f32>,
    #[serde(rename = "memoryController", skip_serializing_if = "Option::is_none")]
    pub memory_controller: Option<f32>,
    #[serde(rename = "cuda", skip_serializing_if = "Option::is_none")]
    pub cuda: Option<f32>,
    #[serde(rename = "threeD", skip_serializing_if = "Option::is_none")]
    pub three_d: Option<f32>,
}

impl LoadData {
    pub fn new() -> LoadData {
        LoadData {
            core: None,
            frame_buffer: None,
            video_engine: None,
            bus_interface: None,
            memory: None,
            memory_controller: None,
            cuda: None,
            three_d: None,
        }
    }
}


