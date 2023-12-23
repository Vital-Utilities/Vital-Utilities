use std::collections::HashMap;

use log::info;
use sysinfo::{DiskExt, SystemExt};
use vital_service_api::models::{DiskLoad, DiskType, DiskUsage, DriveType};

pub async fn get_disk_util(sysinfo: &sysinfo::System) -> Box<HashMap<String, DiskUsage>> {
    let mut list = Box::new(HashMap::new());
    let disks = sysinfo.disks();

    for disk in disks {
        let key = disk.mount_point().to_str().unwrap().to_string();
        let disk_type = match disk.kind() {
            sysinfo::DiskKind::HDD => DiskType::Hdd,
            sysinfo::DiskKind::SSD => DiskType::Hdd,
            sysinfo::DiskKind::Unknown(_) => DiskType::Unknown,
        };
        
        let disk_load = DiskLoad {
            used_space_bytes: Some((disk.total_space() - disk.available_space()) as i64),
            total_free_space_bytes: Some(disk.total_space() as i64),
            used_space_percentage: Some(
                (disk.total_space() - disk.available_space()) as f32
                / disk.total_space() as f32
                * 100.0,
            ),
            total_activity_percentage: None,
            write_activity_percentage: None,
        };
        info!("{:?}",disk_load);
        list.insert(
            disk.mount_point().to_str().unwrap().to_string(),
            DiskUsage {
                name: key.clone(),
                letter: Some(key.clone()),
                disk_type,
                load: Box::new(disk_load),
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
