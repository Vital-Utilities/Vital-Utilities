use log::error;
use nvml::{struct_wrappers::device::ProcessUtilizationSample, NVML};

use crate::generated_vital_rust_service_api_def;

pub fn get_gpu_util(device: &nvml::Device) -> generated_vital_rust_service_api_def::GpuUsage {
    let utilization = device.utilization_rates().unwrap();
    let mem = device.memory_info().unwrap();
    return generated_vital_rust_service_api_def::GpuUsage {
        name: device.name().unwrap(),
        core_percentage: utilization.gpu as f64,
        mem_percentage: utilization.memory as f64,
        core_clock_mhz: device
            .clock(
                nvml::enum_wrappers::device::Clock::Graphics,
                nvml::enum_wrappers::device::ClockId::Current,
            )
            .unwrap_or(0) as f64,
        mem_clock_mhz: device
            .clock(
                nvml::enum_wrappers::device::Clock::Memory,
                nvml::enum_wrappers::device::ClockId::Current,
            )
            .unwrap_or(0) as f64,
        core_power_watt: device.power_usage().unwrap_or(0) as f64,
        pci_throughput_recieve_k_bs: device
            .pcie_throughput(nvml::enum_wrappers::device::PcieUtilCounter::Receive)
            .unwrap_or(0) as f64,
        pci_throughput_send_k_bs: device
            .pcie_throughput(nvml::enum_wrappers::device::PcieUtilCounter::Send)
            .unwrap_or(0) as f64,
        mem_total_kb: mem.used as f64,
    };
}

pub fn get_process_gpu_util(nvml: &Option<NVML>) -> Option<Vec<ProcessUtilizationSample>> {
    if nvml.is_none() {
        return None;
    }
    let mut process_data = Vec::new();
    if let Some(nvml) = nvml {
        let count = nvml.device_count();
        if count.is_err() {
            error!("{}", "failed to get device count");
            return None;
        }

        for i in 0..count.unwrap() {
            let device = nvml.device_by_index(i);
            if let Ok(device) = device {
                let util = device.process_utilization_stats(None);
                if util.is_ok() {
                    process_data.push(util.unwrap());
                }
            }
        }
    }

    // flat map the vector of vectors
    return Some(process_data.into_iter().flatten().collect());
}
