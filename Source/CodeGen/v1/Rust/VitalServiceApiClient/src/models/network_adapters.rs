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
pub struct NetworkAdapters {
    #[serde(rename = "adapters")]
    pub adapters: ::std::collections::HashMap<String, crate::models::NetworkAdapter>,
}

impl NetworkAdapters {
    pub fn new(adapters: ::std::collections::HashMap<String, crate::models::NetworkAdapter>) -> NetworkAdapters {
        NetworkAdapters {
            adapters,
        }
    }
}


