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
pub struct ProcessDiskUsage {
    #[serde(rename = "readBytesPerSecond")]
    pub read_bytes_per_second: f32,
    #[serde(rename = "writeBytesPerSecond")]
    pub write_bytes_per_second: f32,
}

impl ProcessDiskUsage {
    pub fn new(read_bytes_per_second: f32, write_bytes_per_second: f32) -> ProcessDiskUsage {
        ProcessDiskUsage {
            read_bytes_per_second,
            write_bytes_per_second,
        }
    }
}


