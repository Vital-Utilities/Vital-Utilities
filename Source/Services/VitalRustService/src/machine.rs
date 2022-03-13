use std::collections::HashMap;

use sysinfo::{DiskExt, NetworkExt, ProcessorExt, SystemExt};
use systemstat::Platform;

use crate::generated_vital_rust_service_api_def::{
    self, DiskLoad, NetworkAdapterProperties, NetworkAdapterUsage, NetworkAdapterUtil,
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
            properties: NetworkAdapterProperties {
                name: int.name,
                description: int.description,
                mac_address: int.mac_addr.unwrap().address(),
                i_pv4_address: Some(int.ipv4.into_iter().map(|x| x.addr.to_string()).collect()),
                i_pv6_address: Some(int.ipv6.into_iter().map(|x| x.addr.to_string()).collect()),
                dns_suffix: None,
                speed_bps: None,
                connection_type: None,
            },
            utilisation: match stats {
                Some(stats) => Some(NetworkAdapterUtil {
                    send_bps: stats.1.transmitted() as f64,
                    recieve_bps: stats.1.received() as f64,
                }),
                None => None,
            },
        });
    }

    return list;
}

pub async fn get_cpu_util(
    sysinfo: &sysinfo::System,
    sysstat: &systemstat::System,
) -> generated_vital_rust_service_api_def::CpuUsage {
    let mut core_percentages = Vec::new();
    let mut core_frequencies = Vec::new();
    for processor in sysinfo.processors() {
        core_percentages.push(processor.cpu_usage() as f64);
        core_frequencies.push(processor.frequency() as f64);
    }
    return generated_vital_rust_service_api_def::CpuUsage {
        cpu_percentage: sysinfo.global_processor_info().cpu_usage() as f64,
        core_percentages,
        core_frequencies,
        cpu_temp: sysstat.cpu_temp().unwrap_or(0.0) as f64,
    };
}

pub async fn get_disk_util(
    sysinfo: &sysinfo::System,
) -> HashMap<String, generated_vital_rust_service_api_def::Disk> {
    let mut list = HashMap::new();
    let disks = sysinfo.disks();

    for disk in disks {
        let key = disk.mount_point().to_str().unwrap().to_string();
        list.insert(
            disk.mount_point().to_str().unwrap().to_string(),
            generated_vital_rust_service_api_def::Disk {
                name: key.clone(),
                letter: Some(key.clone()),
                disk_type: Some(match disk.type_() {
                    sysinfo::DiskType::HDD => generated_vital_rust_service_api_def::DiskType::Hdd,
                    sysinfo::DiskType::SSD => generated_vital_rust_service_api_def::DiskType::Ssd,
                    sysinfo::DiskType::Unknown(_) => {
                        generated_vital_rust_service_api_def::DiskType::Unknown
                    }
                }),
                load: Some(DiskLoad {
                    used_space_bytes: Some((disk.total_space() - disk.available_space()) as f64),
                    total_free_space_bytes: Some(disk.total_space() as f64),
                    used_space_percentage: Some(
                        (disk.total_space() - disk.available_space()) as f64
                            / disk.total_space() as f64
                            * 100.0,
                    ),
                    total_activity_percentage: None,
                    write_activity_percentage: None,
                }),
                health: None,
                serial: None,
                temperatures: None,
                throughput: None,
            },
        );
    }

    return list;
}

pub async fn get_mem_util(
    sysinfo: &sysinfo::System,
) -> generated_vital_rust_service_api_def::MemUsage {
    return generated_vital_rust_service_api_def::MemUsage {
        mem_percentage: sysinfo.used_memory() as f64 / sysinfo.total_memory() as f64 * 100 as f64,
        mem_total_kb: sysinfo.total_memory() as f64,
        mem_used_kb: sysinfo.used_memory() as f64,
        swap_percentage: sysinfo.used_swap() as f64 / sysinfo.total_swap() as f64 * 100 as f64,
        swap_total_kb: sysinfo.total_swap() as f64,
        swap_used_kb: sysinfo.used_swap() as f64,
    };
}
