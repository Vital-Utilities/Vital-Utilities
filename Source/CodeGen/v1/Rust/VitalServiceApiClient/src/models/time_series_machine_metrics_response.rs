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
pub struct TimeSeriesMachineMetricsResponse {
    #[serde(rename = "requestRange")]
    pub request_range: Box<crate::models::DateRange>,
    #[serde(rename = "metrics")]
    pub metrics: Vec<crate::models::TimeSeriesMachineMetricsModel>,
}

impl TimeSeriesMachineMetricsResponse {
    pub fn new(request_range: crate::models::DateRange, metrics: Vec<crate::models::TimeSeriesMachineMetricsModel>) -> TimeSeriesMachineMetricsResponse {
        TimeSeriesMachineMetricsResponse {
            request_range: Box::new(request_range),
            metrics,
        }
    }
}


