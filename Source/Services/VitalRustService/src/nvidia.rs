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
