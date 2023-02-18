use std::collections::HashMap;

use log::error;
use nvml::{struct_wrappers::device::ProcessUtilizationSample, Device, Nvml};
use vital_service_api::models::{GpuClockSpeeds, GpuUsage, LoadData, PcieThroughPut};

pub fn get_gpu_util(nvml: &Option<Nvml>) -> Vec<GpuUsage> {
    if nvml.is_none() {
        return Vec::new();
    }
    let mut list = Vec::new();

    if let Some(nvml) = nvml {
        let count = nvml.device_count();
        if count.is_err() {
            error!("{:?}", count.err().unwrap());
            return list;
        }

        for device_index in 0..count.unwrap() {
            let device = nvml.device_by_index(device_index);
            if device.is_err() {
                error!("{:?}", device.unwrap_err());
                continue;
            }
            let device = device.unwrap();
            let fan_count = device.num_fans();
            let mut fan_percentages = HashMap::new();

            if let Ok(fan_count) = fan_count {
                for fan_index in 0..fan_count {
                    match device.fan_speed(fan_index) {
                        Ok(speed) => {
                            fan_percentages.insert(format!("Fan {}", fan_index), speed as f32);
                        }
                        Err(_) => {
                            error!(
                                "Failed to get fan speed for device {:?}. Fan index {:?}",
                                device.name(),
                                fan_index
                            );
                        }
                    }
                }
            }
            let mut total_memory_bytes: Option<i64> = None;
            let mut memory_used_bytes: Option<i64> = None;

            match device.memory_info() {
                Ok(info) => {
                    total_memory_bytes = Some(info.total as i64);
                    memory_used_bytes = Some(info.used as i64);
                }
                Err(e) => {
                    error!(
                        "Failed to get memory info for device {:?}. Error: {:?}",
                        device.name(),
                        e
                    );
                }
            }

            let mut temperature_readings = HashMap::new();

            match device.temperature(nvml::enum_wrappers::device::TemperatureSensor::Gpu) {
                Ok(temp) => {
                    temperature_readings.insert("GPU".to_string(), temp as f32);
                }
                Err(e) => {
                    error!(
                        "Failed to get temperature for device {:?}. Error: {:?}",
                        device.name(),
                        e
                    );
                }
            }

            let data = GpuUsage {
                name: match device.name() {
                    Ok(name) => Some(name),
                    Err(_) => None,
                },
                temperature_readings,
                total_memory_bytes,
                memory_used_bytes,
                fan_percentage: Some(fan_percentages),
                power_draw_watt: match device.power_usage() {
                    Ok(milliwatt) => Some((milliwatt / 1000) as i32),
                    Err(_) => None,
                },
                clock_speeds: Some(Box::new(get_gpu_clock_speeds(&device))),
                load: Some(Box::new(get_gpu_load(&device))),
                pc_ie: Some(Box::new(get_pcie_throughput(&device))),
            };
            list.push(data);
        }
    }
    list
}

fn get_gpu_load(device: &Device) -> LoadData {
    LoadData {
        core_percentage: Some(device.utilization_rates().unwrap().gpu as f32),
        frame_buffer_percentage: None,
        video_engine_percentage: None,
        bus_interface_percentage: None,
        memory_used_percentage: None,
        memory_controller_percentage: Some(device.utilization_rates().unwrap().gpu as f32),
        cuda_percentage: None,
        three_d_percentage: None,
    }
}

fn get_gpu_clock_speeds(device: &Device) -> GpuClockSpeeds {
    GpuClockSpeeds {
        memory_clock_mhz: match device.clock_info(nvml::enum_wrappers::device::Clock::Memory) {
            Ok(speed) => Some(speed as i32),
            Err(_) => None,
        },
        compute_clock_mhz: match device.clock_info(nvml::enum_wrappers::device::Clock::SM) {
            Ok(speed) => Some(speed as i32),
            Err(_) => None,
        },
        graphics_clock_mhz: match device.clock_info(nvml::enum_wrappers::device::Clock::Graphics) {
            Ok(speed) => Some(speed as i32),
            Err(_) => None,
        },
        video_clock_mhz: match device.clock_info(nvml::enum_wrappers::device::Clock::Video) {
            Ok(speed) => Some(speed as i32),
            Err(_) => None,
        },
    }
}

fn get_pcie_throughput(device: &Device) -> PcieThroughPut {
    PcieThroughPut {
        pc_ie_rx_bytes_per_second: match device
            .pcie_throughput(nvml::enum_wrappers::device::PcieUtilCounter::Receive)
        {
            Ok(bytes) => Some(bytes as i64),
            Err(_) => None,
        },
        pc_ie_tx_bytes_per_second: match device
            .pcie_throughput(nvml::enum_wrappers::device::PcieUtilCounter::Send)
        {
            Ok(bytes) => Some(bytes as i64),
            Err(_) => None,
        },
    }
}

pub fn get_process_gpu_util(nvml: &Option<Nvml>) -> Option<Vec<ProcessUtilizationSample>> {
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
                if let Ok(util) = util {
                    process_data.push(util);
                }
            }
        }
    }

    // flat map the vector of vectors
    Some(process_data.into_iter().flatten().collect())
}
