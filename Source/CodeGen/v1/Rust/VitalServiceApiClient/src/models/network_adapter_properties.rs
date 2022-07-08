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
pub struct NetworkAdapterProperties {
    #[serde(rename = "ipInterfaceProperties", skip_serializing_if = "Option::is_none")]
    pub ip_interface_properties: Option<Box<crate::models::IpInterfaceProperties>>,
    #[serde(rename = "name")]
    pub name: String,
    #[serde(rename = "description")]
    pub description: Option<String>,
    #[serde(rename = "macAddress")]
    pub mac_address: String,
    #[serde(rename = "speedBps")]
    pub speed_bps: i64,
    #[serde(rename = "connectionType")]
    pub connection_type: String,
}

impl NetworkAdapterProperties {
    pub fn new(name: String, description: Option<String>, mac_address: String, speed_bps: i64, connection_type: String) -> NetworkAdapterProperties {
        NetworkAdapterProperties {
            ip_interface_properties: None,
            name,
            description,
            mac_address,
            speed_bps,
            connection_type,
        }
    }
}


