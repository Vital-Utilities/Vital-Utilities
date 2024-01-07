use nvml::Nvml;


use vital_service_api::models::GpuUsage;

use crate::nvidia;

pub async fn get_gpu_util(nvml: &Option<Nvml>) -> Vec<GpuUsage> {
    let mut list = Vec::new();
    if nvml.is_none() {
        return Vec::new();
    }
    // append nvidia_gpus into list
    for gpu in nvidia::get_gpu_util(nvml) {
        list.push(gpu);
    }

    list
}
