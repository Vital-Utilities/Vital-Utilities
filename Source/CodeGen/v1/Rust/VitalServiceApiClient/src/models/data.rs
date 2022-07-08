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
pub struct Data {
    #[serde(rename = "dataReadBytes")]
    pub data_read_bytes: Option<i64>,
    #[serde(rename = "dataWrittenBytes")]
    pub data_written_bytes: Option<i64>,
}

impl Data {
    pub fn new(data_read_bytes: Option<i64>, data_written_bytes: Option<i64>) -> Data {
        Data {
            data_read_bytes,
            data_written_bytes,
        }
    }
}


