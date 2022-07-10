use std::collections::HashMap;

use log::error;
use nvml::{struct_wrappers::device::ProcessUtilizationSample, Nvml};
use vital_service_api::models::{GpuUsages, LoadData, PcieThroughPut};

pub fn get_gpu_util(device: &nvml::Device) -> GpuUsages {
    let utilization = device.utilization_rates().unwrap();
    let mem = device.memory_info().unwrap();
    let mut fans = HashMap::<String, f32>::new();

    for i in 0.. {
        match device.fan_speed(i) {
            Ok(speed) => {
                fans.insert(format!("Fan {}", i), speed as f32);
            }
            Err(_) => {
                break;
            }
        }
    }

    return GpuUsages {
        name: match device.name() {
            Ok(name) => Some(name),
            Err(e) => {
                error!("Could not get GPU name: {}", e);
                None
            }
        },

        load: Some(Box::new(LoadData {
            core_percentage: Some(utilization.gpu as f32),
            frame_buffer_percentage: None,
            video_engine_percentage: None,
            bus_interface_percentage: None,
            memory_used_percentage: Some((mem.used as f32 / mem.total as f32) * 100.0),
            memory_controller_percentage: Some(utilization.memory as f32),
            cuda_percentage: None,
            three_d_percentage: None,
        })),
        core_clock_mhz: match device.clock(
            nvml::enum_wrappers::device::Clock::Graphics,
            nvml::enum_wrappers::device::ClockId::Current,
        ) {
            Ok(clock) => Some(clock as i32),
            Err(_) => None,
        },
        memory_clock_mhz: match device.clock(
            nvml::enum_wrappers::device::Clock::Memory,
            nvml::enum_wrappers::device::ClockId::Current,
        ) {
            Ok(clock) => Some(clock as i32),
            Err(_) => None,
        },
        shader_clock_mhz: match device.clock(
            nvml::enum_wrappers::device::Clock::SM,
            nvml::enum_wrappers::device::ClockId::Current,
        ) {
            Ok(clock) => Some(clock as i32),
            Err(_) => None,
        },
        temperature_readings: match device
            .temperature(nvml::enum_wrappers::device::TemperatureSensor::Gpu)
        {
            Ok(temp) => {
                let mut temperature_readings = HashMap::new();
                temperature_readings.insert("GPU".to_string(), temp as f32);
                temperature_readings
            }
            Err(_) => HashMap::new(),
        },
        power_draw_watt: match device.power_usage() {
            Ok(power) => Some(power as i32),
            Err(_) => None,
        },
        pc_ie: Some(Box::new(PcieThroughPut {
            pc_ie_rx_bytes_per_second: match device
                .pcie_throughput(nvml::enum_wrappers::device::PcieUtilCounter::Receive)
            {
                Ok(throughput) => Some((throughput * 1000).into()),
                Err(_) => None,
            },
            pc_ie_tx_bytes_per_second: match device
                .pcie_throughput(nvml::enum_wrappers::device::PcieUtilCounter::Send)
            {
                Ok(throughput) => Some((throughput * 1000).into()),
                Err(_) => None,
            },
        })),
        fan_percentage: Some(fans),
        memory_used_bytes: Some(mem.used as i64),
        total_memory_bytes: Some(mem.total as i64),
    };
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
                if util.is_ok() {
                    process_data.push(util.unwrap());
                }
            }
        }
    }

    // flat map the vector of vectors
    return Some(process_data.into_iter().flatten().collect());
}
