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
pub struct GetAllResponse {
    #[serde(rename = "managedModels")]
    pub managed_models: Vec<crate::models::ManagedModelDto>,
    #[serde(rename = "processesToAdd")]
    pub processes_to_add: Vec<crate::models::ProcessToAddDto>,
}

impl GetAllResponse {
    pub fn new(managed_models: Vec<crate::models::ManagedModelDto>, processes_to_add: Vec<crate::models::ProcessToAddDto>) -> GetAllResponse {
        GetAllResponse {
            managed_models,
            processes_to_add,
        }
    }
}


