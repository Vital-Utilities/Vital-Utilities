use std::{any::Any, collections::HashMap};

use nvml::Nvml;
use sysinfo::{CpuExt, DiskExt, NetworkExt, SystemExt};
use systemstat::Platform;
use vital_service_api::models::{
    CpuUsage, DiskLoad, DiskType, DiskUsage, DriveType, GpuUsage, IpInterfaceProperties,
    MemoryUsage, NetAdapterUsage, NetworkAdapterProperties, NetworkAdapterUsage,
};

use crate::nvidia;

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
                mac_address: Some(int.mac_addr.unwrap().address()),
                ip_interface_properties: Some(Box::new(IpInterfaceProperties {
                    i_pv4_address: Some(int.ipv4.into_iter().map(|x| x.addr.to_string()).collect()),
                    i_pv6_address: Some(int.ipv6.into_iter().map(|x| x.addr.to_string()).collect()),
                    is_dns_enabled: None,
                    dns_suffix: None,
                })),
                speed_bps: None,
                connection_type: None,
            }),
            usage: stats.map(|stats| {
                Box::new(NetAdapterUsage {
                    send_bps: stats.1.transmitted() as i64,
                    recieve_bps: stats.1.received() as i64,
                    usage_percentage: None,
                })
            }),
        });
    }

    list
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
    if let Ok(temp) = sysstat.cpu_temp() {
        temperature_readings.insert("CPU Package".to_string(), temp as f32);
    }
    let info = sysinfo.global_cpu_info();
    Box::new(CpuUsage {
        name: info.name().to_string(),
        brand: Some(info.brand().to_string()),
        vendor_id: Some(info.vendor_id().to_string()),
        core_clocks_mhz,
        total_core_percentage: info.cpu_usage() as f32,
        power_draw_wattage: None,
        core_percentages,
        temperature_readings: temperature_readings.clone(),
    })
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
                disk_type: match disk.kind() {
                    sysinfo::DiskKind::HDD => DiskType::HDD,
                    sysinfo::DiskKind::SSD => DiskType::SSD,
                    sysinfo::DiskKind::Unknown(_) => DiskType::Unknown,
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

    list
}

pub async fn get_mem_util(sysinfo: &sysinfo::System) -> MemoryUsage {
    MemoryUsage {
        total_visible_memory_bytes: (sysinfo.total_memory()) as i64,
        used_memory_bytes: (sysinfo.used_memory()) as i64,
        swap_percentage: (sysinfo.used_swap() as f32 / sysinfo.total_swap() as f32) * 100.0,
        swap_total_bytes: sysinfo.total_swap() as i64,
        swap_used_bytes: sysinfo.used_swap() as i64,
    }
}

pub async fn get_gpu_util(nvml: &Option<Nvml>) -> Vec<GpuUsage> {
    let mut list = Vec::new();

    // append nvidia_gpus into list
    for gpu in nvidia::get_gpu_util(nvml) {
        list.push(gpu);
    }

    list
}
