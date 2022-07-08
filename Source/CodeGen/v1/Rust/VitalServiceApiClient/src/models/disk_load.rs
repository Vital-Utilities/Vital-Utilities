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
pub struct DiskLoad {
    #[serde(rename = "usedSpacePercentage")]
    pub used_space_percentage: Option<f32>,
    #[serde(rename = "usedSpaceBytes")]
    pub used_space_bytes: Option<i64>,
    #[serde(rename = "totalFreeSpaceBytes")]
    pub total_free_space_bytes: Option<i64>,
    #[serde(rename = "writeActivityPercentage")]
    pub write_activity_percentage: Option<f32>,
    #[serde(rename = "totalActivityPercentage")]
    pub total_activity_percentage: Option<f32>,
}

impl DiskLoad {
    pub fn new(used_space_percentage: Option<f32>, used_space_bytes: Option<i64>, total_free_space_bytes: Option<i64>, write_activity_percentage: Option<f32>, total_activity_percentage: Option<f32>) -> DiskLoad {
        DiskLoad {
            used_space_percentage,
            used_space_bytes,
            total_free_space_bytes,
            write_activity_percentage,
            total_activity_percentage,
        }
    }
}


