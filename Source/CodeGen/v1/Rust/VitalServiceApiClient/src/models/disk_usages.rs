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
pub struct DiskUsages {
    #[serde(rename = "disks")]
    pub disks: ::std::collections::HashMap<String, crate::models::DiskUsage>,
}

impl DiskUsages {
    pub fn new(disks: ::std::collections::HashMap<String, crate::models::DiskUsage>) -> DiskUsages {
        DiskUsages {
            disks,
        }
    }
}


