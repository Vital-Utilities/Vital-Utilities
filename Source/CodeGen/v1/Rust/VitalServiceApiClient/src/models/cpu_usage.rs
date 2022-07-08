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
pub struct CpuUsage {
    #[serde(rename = "coreClocksMhz")]
    pub core_clocks_mhz: Vec<f32>,
    #[serde(rename = "total")]
    pub total: f32,
    #[serde(rename = "powerDrawWattage")]
    pub power_draw_wattage: Option<f32>,
    #[serde(rename = "corePercentages")]
    pub core_percentages: Vec<f32>,
    #[serde(rename = "temperatureReadings")]
    pub temperature_readings: ::std::collections::HashMap<String, f32>,
}

impl CpuUsage {
    pub fn new(core_clocks_mhz: Vec<f32>, total: f32, power_draw_wattage: Option<f32>, core_percentages: Vec<f32>, temperature_readings: ::std::collections::HashMap<String, f32>) -> CpuUsage {
        CpuUsage {
            core_clocks_mhz,
            total,
            power_draw_wattage,
            core_percentages,
            temperature_readings,
        }
    }
}


