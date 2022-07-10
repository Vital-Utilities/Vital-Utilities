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
pub struct UpdateManagedRequest {
    #[serde(rename = "managedModelDto")]
    pub managed_model_dto: Box<crate::models::ManagedModelDto>,
}

impl UpdateManagedRequest {
    pub fn new(managed_model_dto: crate::models::ManagedModelDto) -> UpdateManagedRequest {
        UpdateManagedRequest {
            managed_model_dto: Box::new(managed_model_dto),
        }
    }
}


