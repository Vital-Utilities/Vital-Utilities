use std::collections::HashMap;

use log::info;
use openapi::models::{
    CpuUsage, DiskLoad, DiskType, DiskUsage, DriveType, IpInterfaceProperties, MemoryUsage,
    NetAdapterUsage, NetworkAdapterProperties, NetworkAdapterUsage,
};
use sysinfo::{DiskExt, NetworkExt, ProcessorExt, SystemExt};
use systemstat::Platform;

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
                    is_dns_enabled: int.gateway.is_some(),
                    dns_suffix: None,
                })),
                speed_bps: None,
                connection_type: None,
            }),
            usage: match stats {
                Some(stats) => Box::new(NetAdapterUsage {
                    send_bps: stats.1.transmitted() as i64,
                    recieve_bps: stats.1.received() as i64,
                    recieved_bytes: stats.1.total_received() as i64,
                    sent_bytes: stats.1.total_transmitted() as i64,
                    usage_percentage: None,
                }),
                None => Box::new(NetAdapterUsage::default()),
            },
        });
    }

    return list;
}

pub async fn get_cpu_util(sysinfo: &sysinfo::System, sysstat: &systemstat::System) -> CpuUsage {
    let mut core_percentages = Vec::new();
    let mut core_clocks_mhz = Vec::new();
    for processor in sysinfo.processors() {
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
    return CpuUsage {
        core_clocks_mhz,
        total: sysinfo.global_processor_info().cpu_usage() as f32,
        power_draw_wattage: None,
        core_percentages,
        temperature_readings: temperature_readings.clone(),
    };
}

pub async fn get_disk_util(sysinfo: &sysinfo::System) -> HashMap<String, DiskUsage> {
    let mut list = HashMap::new();
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
