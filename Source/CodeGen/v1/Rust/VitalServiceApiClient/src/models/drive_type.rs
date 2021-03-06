/*
 * VitalService
 *
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: 1.0
 * 
 * Generated by: https://openapi-generator.tech
 */


/// 
#[derive(Clone, Copy, Debug, Eq, PartialEq, Ord, PartialOrd, Hash, Serialize, Deserialize)]
pub enum DriveType {
    #[serde(rename = "Unknown")]
    Unknown,
    #[serde(rename = "NoRootDirectory")]
    NoRootDirectory,
    #[serde(rename = "Removable")]
    Removable,
    #[serde(rename = "Fixed")]
    Fixed,
    #[serde(rename = "Network")]
    Network,
    #[serde(rename = "CDRom")]
    CDRom,
    #[serde(rename = "Ram")]
    Ram,

}

impl ToString for DriveType {
    fn to_string(&self) -> String {
        match self {
            Self::Unknown => String::from("Unknown"),
            Self::NoRootDirectory => String::from("NoRootDirectory"),
            Self::Removable => String::from("Removable"),
            Self::Fixed => String::from("Fixed"),
            Self::Network => String::from("Network"),
            Self::CDRom => String::from("CDRom"),
            Self::Ram => String::from("Ram"),
        }
    }
}

impl Default for DriveType {
    fn default() -> DriveType {
        Self::Unknown
    }
}




