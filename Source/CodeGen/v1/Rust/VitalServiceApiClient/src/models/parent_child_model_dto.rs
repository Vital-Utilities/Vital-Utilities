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
pub struct ParentChildModelDto {
    #[serde(rename = "parent")]
    pub parent: Box<crate::models::ProcessViewDto>,
    #[serde(rename = "children")]
    pub children: ::std::collections::HashMap<String, crate::models::ProcessViewDto>,
}

impl ParentChildModelDto {
    pub fn new(parent: crate::models::ProcessViewDto, children: ::std::collections::HashMap<String, crate::models::ProcessViewDto>) -> ParentChildModelDto {
        ParentChildModelDto {
            parent: Box::new(parent),
            children,
        }
    }
}


