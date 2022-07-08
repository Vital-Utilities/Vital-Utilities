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
pub struct NetworkAdapterUsage {
    #[serde(rename = "usage")]
    pub usage: Box<crate::models::NetAdapterUsage>,
    #[serde(rename = "properties")]
    pub properties: Box<crate::models::NetworkAdapterProperties>,
}

impl NetworkAdapterUsage {
    pub fn new(usage: crate::models::NetAdapterUsage, properties: crate::models::NetworkAdapterProperties) -> NetworkAdapterUsage {
        NetworkAdapterUsage {
            usage: Box::new(usage),
            properties: Box::new(properties),
        }
    }
}


