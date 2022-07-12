use std::collections::HashMap;

use log::error;
use nvml::{Device, Nvml};
use sysinfo::{CpuExt, DiskExt, NetworkExt, SystemExt};
use systemstat::Platform;
use vital_service_api::models::{
    CpuUsage, DiskLoad, DiskType, DiskUsage, DriveType, GpuClockSpeeds, GpuUsage,
    IpInterfaceProperties, LoadData, MemoryUsage, NetAdapterUsage, NetworkAdapterProperties,
    NetworkAdapterUsage, PcieThroughPut,
};

pub async fn get_net_adapters(sysinfo: &sysinfo::System) -> Vec<NetworkAdapterUsage> {
    let mut list = Vec::new();
    let mut utils = Vec::new();

    let networks = sysinfo.networks();

    for data in networks {
        utils.push(data);
    }

    for (_, int) in default_net::get_interfaces().into_iter().enumerate() {
        let stats = utils.get(int.index as usize);

        list.push(NetworkAdapterUsage {
            properties: Box::new(NetworkAdapterProperties {
                name: int.name,
                description: int.description,
                mac_address: int.mac_addr.unwrap().address(),
                ip_interface_properties: Some(Box::new(IpInterfaceProperties {
                    i_pv4_address: Some(int.ipv4.into_iter().map(|x| x.addr.to_string()).collect()),
                    i_pv6_address: Some(int.ipv6.into_iter().map(|x| x.addr.to_string()).collect()),
                    is_dns_enabled: None,
                    dns_suffix: None,
                })),
                speed_bps: None,
                connection_type: None,
            }),
            usage: match stats {
                Some(stats) => Some(Box::new(NetAdapterUsage {
                    send_bps: stats.1.transmitted() as i64,
                    recieve_bps: stats.1.received() as i64,
                    recieved_bytes: stats.1.total_received() as i64,
                    sent_bytes: stats.1.total_transmitted() as i64,
                    usage_percentage: None,
                })),
                None => None,
            },
        });
    }

    return list;
}

pub async fn get_cpu_util(
    sysinfo: &sysinfo::System,
    sysstat: &systemstat::System,
) -> Box<CpuUsage> {
    let mut core_percentages = Vec::new();
    let mut core_clocks_mhz = Vec::new();

    for processor in sysinfo.cpus() {
        core_percentages.push(processor.cpu_usage());
        core_clocks_mhz.push(processor.frequency() as i32);
    }

    let mut temperature_readings = HashMap::new();
    match sysstat.cpu_temp() {
        Ok(temp) => {
            temperature_readings.insert("CPU Package".to_string(), temp as f32);
        }
        Err(_) => {}
    }
    let info = sysinfo.global_cpu_info();
    return Box::new(CpuUsage {
        name: info.name().to_string(),
        brand: Some(info.brand().to_string()),
        vendor_id: Some(info.vendor_id().to_string()),
        core_clocks_mhz,
        total_core_percentage: info.cpu_usage() as f32,
        power_draw_wattage: None,
        core_percentages,
        temperature_readings: temperature_readings.clone(),
    });
}

pub async fn get_disk_util(sysinfo: &sysinfo::System) -> Box<HashMap<String, DiskUsage>> {
    let mut list = Box::new(HashMap::new());
    let disks = sysinfo.disks();

    for disk in disks {
        let key = disk.mount_point().to_str().unwrap().to_string();
        list.insert(
            disk.mount_point().to_str().unwrap().to_string(),
            DiskUsage {
                name: key.clone(),
                letter: Some(key.clone()),
                disk_type: match disk.type_() {
                    sysinfo::DiskType::HDD => DiskType::HDD,
                    sysinfo::DiskType::SSD => DiskType::SSD,
                    sysinfo::DiskType::Unknown(_) => DiskType::Unknown,
                },
                load: Box::new(DiskLoad {
                    used_space_bytes: Some((disk.total_space() - disk.available_space()) as i64),
                    total_free_space_bytes: Some(disk.total_space() as i64),
                    used_space_percentage: Some(
                        (disk.total_space() - disk.available_space()) as f32
                            / disk.total_space() as f32
                            * 100.0,
                    ),
                    total_activity_percentage: None,
                    write_activity_percentage: None,
                }),
                disk_health: None,
                serial: None,
                temperatures: HashMap::new(),
                throughput: None,
                unique_identifier: None,
                drive_type: DriveType::Unknown,
                volume_label: None,
            },
        );
    }

    return list;
}

pub async fn get_mem_util(sysinfo: &sysinfo::System) -> MemoryUsage {
    return MemoryUsage {
        total_visible_memory_bytes: (sysinfo.total_memory() * 1000) as i64,
        used_memory_bytes: (sysinfo.used_memory() * 1000) as i64,
        swap_percentage: (sysinfo.used_swap() as f32 / sysinfo.total_swap() as f32) * 100.0,
        swap_total_bytes: sysinfo.total_swap() as i64,
        swap_used_bytes: sysinfo.used_swap() as i64,
    };
}

pub async fn get_gpu_util(nvml: &Option<Nvml>) -> Vec<GpuUsage> {
    if nvml.is_none() {
        return Vec::new();
    }
    let mut list = Vec::new();

    if let Some(nvml) = nvml {
        let count = nvml.device_count();
        if count.is_err() {
            error!("{:?}", count.err().unwrap());
            return Vec::new();
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
            if fan_count.is_ok() {
                for fan_index in 0..fan_count.unwrap() {
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
            let mut mem_total: Option<i64> = None;
            let mut mem_used: Option<i64> = None;

            match device.memory_info() {
                Ok(info) => {
                    mem_total = Some(info.total as i64);
                    mem_used = Some(info.used as i64);
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
                temperature_readings: temperature_readings,
                total_memory_bytes: mem_total,
                memory_used_bytes: mem_used,

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
    return list;
}

fn get_gpu_load(device: &Device) -> LoadData {
    return LoadData {
        core_percentage: Some(device.utilization_rates().unwrap().gpu as f32),
        frame_buffer_percentage: None,
        video_engine_percentage: None,
        bus_interface_percentage: None,
        memory_used_percentage: None,
        memory_controller_percentage: Some(device.utilization_rates().unwrap().gpu as f32),
        cuda_percentage: None,
        three_d_percentage: None,
    };
}

fn get_gpu_clock_speeds(device: &Device) -> GpuClockSpeeds {
    return GpuClockSpeeds {
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
    };
}

fn get_pcie_throughput(device: &Device) -> PcieThroughPut {
    return PcieThroughPut {
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
    };
}
