use serde::{Deserialize, Serialize}; 
// Example code that deserializes and serializes the model.
// extern crate serde;
// #[macro_use]
// extern crate serde_derive;
// extern crate serde_json;
//
// use generated_module::[object Object];
//
// fn main() {
//     let json = r#"{"answer": 42}"#;
//     let model: [object Object] = serde_json::from_str(&json).unwrap();
// }

extern crate serde_derive;

#[derive(Serialize, Deserialize)]
pub struct Process {
    #[serde(rename = "gpuCorePercentage")]
    pub gpu_core_percentage: f64,

    #[serde(rename = "pid")]
    pub pid: f64,

    #[serde(rename = "timeStamp")]
    pub time_stamp: String,
}
