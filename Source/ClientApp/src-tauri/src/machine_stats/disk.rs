use std::collections::HashMap;

use sysinfo::Disks;
use vital_service_api::models::{DiskLoad, DiskType, DiskUsage, DriveType};

pub async fn get_disk_util(_sysinfo: &sysinfo::System) -> Box<HashMap<String, DiskUsage>> {
    let mut list = Box::new(HashMap::new());
    let disks = Disks::new_with_refreshed_list();

    for disk in &disks {
        let mount_point = disk.mount_point().to_str().unwrap_or_default();

        // Only include root mount point, skip all other volumes
        if mount_point != "/" {
            continue;
        }

        let disk_type = match disk.kind() {
            sysinfo::DiskKind::HDD => DiskType::Hdd,
            sysinfo::DiskKind::SSD => DiskType::Ssd,
            sysinfo::DiskKind::Unknown(_) => DiskType::Unknown,
        };

        let disk_load = DiskLoad {
            used_space_bytes: Some((disk.total_space() - disk.available_space()) as i64),
            total_space_bytes: Some(disk.total_space() as i64),
            used_space_percentage: Some(
                (disk.total_space() - disk.available_space()) as f32 / disk.total_space() as f32
                    * 100.0,
            ),
            total_activity_percentage: None,
            write_activity_percentage: None,
        };

        let name = disk.name().to_str().unwrap_or("Disk").to_string();

        list.insert(
            mount_point.to_string(),
            DiskUsage {
                name: name.clone(),
                letter: Some(mount_point.to_string()),
                disk_type,
                load: Box::new(disk_load),
                disk_health: None,
                serial: None,
                temperatures: HashMap::new(),
                throughput: None,
                unique_identifier: Some(mount_point.to_string()),
                drive_type: DriveType::Unknown,
                volume_label: disk.name().to_str().map(|s| s.to_string()),
            },
        );
    }

    list
}
