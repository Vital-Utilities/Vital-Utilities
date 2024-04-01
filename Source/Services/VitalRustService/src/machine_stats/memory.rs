use vital_service_api::models::MemoryUsage;

pub async fn get_mem_util(sysinfo: &sysinfo::System) -> MemoryUsage {
    MemoryUsage {
        total_visible_memory_bytes: (sysinfo.total_memory()) as i64,
        used_memory_bytes: (sysinfo.used_memory()) as i64,
        swap_percentage: (sysinfo.used_swap() as f32 / sysinfo.total_swap() as f32) * 100.0,
        swap_total_bytes: sysinfo.total_swap() as i64,
        swap_used_bytes: sysinfo.used_swap() as i64,
    }
}
