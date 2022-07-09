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
pub struct IpInterfaceProperties {
    #[serde(rename = "iPv4Address", skip_serializing_if = "Option::is_none")]
    pub i_pv4_address: Option<String>,
    #[serde(rename = "iPv6Address", skip_serializing_if = "Option::is_none")]
    pub i_pv6_address: Option<String>,
    #[serde(rename = "dnsSuffix", skip_serializing_if = "Option::is_none")]
    pub dns_suffix: Option<String>,
    #[serde(rename = "isDnsEnabled")]
    pub is_dns_enabled: bool,
}

impl IpInterfaceProperties {
    pub fn new(is_dns_enabled: bool) -> IpInterfaceProperties {
        IpInterfaceProperties {
            i_pv4_address: None,
            i_pv6_address: None,
            dns_suffix: None,
            is_dns_enabled,
        }
    }
}


