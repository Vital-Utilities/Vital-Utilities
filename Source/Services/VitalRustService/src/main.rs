#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::sync::Arc;
use std::time::{Duration, SystemTime};
use std::{thread, time::Instant};

extern crate nvml_wrapper as nvml;

use log::{error, info, warn, Level, LevelFilter, Metadata, Record};
use nvml::Nvml;
use rocket::routes;
use systemstat::Platform;
use tokio::join;

// Existing modules
mod api_legacy;
mod commands;
mod machine_stats;
mod nvidia;
pub mod rocket_endpoints;
pub mod software;

// New modules for unified backend
mod api;
mod db;
mod models;
mod platform;
mod services;
mod stores;

use crate::commands::get_vital_service_ports;
use crate::db::{get_app_db_path, get_metrics_db_path, AppDb, MetricsDb};
use crate::machine_stats::{cpu, disk, gpu, memory, net};
use crate::platform::{create_process_manager, create_startup_manager, ProcessManager, StartupManager};
#[cfg(target_os = "windows")]
use crate::services::ConfigApplyerService;
use crate::services::MetricsStorageService;
#[cfg(any(target_os = "windows", target_os = "macos"))]
use crate::software::get_process_util;
use crate::stores::{MachineDataStore, SettingsStore};

static LOGGER: SimpleLogger = SimpleLogger;
static SECOND: core::time::Duration = Duration::from_millis(1000);

#[rocket::main]
async fn main() {
    let _ = log::set_logger(&LOGGER).map(|()| log::set_max_level(LevelFilter::Info));

    info!("Starting VitalRustService...");

    // Initialize settings store
    let settings_store = Arc::new(SettingsStore::new());
    let http_port = settings_store.get_http_port() as u16;

    // Initialize databases
    let app_db = match AppDb::connect(&get_app_db_path()).await {
        Ok(db) => Arc::new(db),
        Err(e) => {
            error!("Failed to connect to app database: {:?}", e);
            panic!("Database connection failed");
        }
    };

    let metrics_db = match MetricsDb::connect(&get_metrics_db_path()).await {
        Ok(db) => Arc::new(db),
        Err(e) => {
            error!("Failed to connect to metrics database: {:?}", e);
            panic!("Database connection failed");
        }
    };

    // Initialize machine data store
    let machine_store = Arc::new(MachineDataStore::new(Some(metrics_db.clone())));

    // Initialize platform managers
    let process_manager: Arc<dyn ProcessManager> = Arc::from(create_process_manager());
    let startup_manager: Arc<dyn StartupManager> = Arc::from(create_startup_manager());

    // Start background services
    let metrics_service = MetricsStorageService::new(
        metrics_db.clone(),
        machine_store.clone(),
        settings_store.clone(),
    );
    tokio::spawn(async move {
        metrics_service.run().await;
    });

    // Start config applyer (applies process affinity/priority)
    #[cfg(target_os = "windows")]
    {
        let config_applyer = ConfigApplyerService::new(app_db.clone(), process_manager.clone());
        tokio::spawn(async move {
            config_applyer.run().await;
        });
    }

    // Clone references for Rocket state
    let app_db_rocket = app_db.clone();
    let machine_store_rocket = machine_store.clone();
    let settings_store_rocket = settings_store.clone();
    let process_manager_rocket = process_manager.clone();
    let startup_manager_rocket = startup_manager.clone();

    // Start Rocket server with new API endpoints
    tokio::spawn(async move {
        let _ = rocket::build()
            // Existing endpoint
            .mount("/", routes![rocket_endpoints::ideal_processors])
            // New API endpoints
            .mount("/api/hello", routes![api::hello::index])
            .mount(
                "/api/profile",
                routes![
                    api::profile::get_all,
                    api::profile::get_by_id,
                    api::profile::create,
                    api::profile::update,
                    api::profile::delete_profile,
                    api::profile::add_process_config,
                    api::profile::update_process_config,
                    api::profile::delete_process_config,
                ],
            )
            .mount(
                "/api/process",
                routes![
                    api::process::get_all,
                    api::process::get_managed,
                    api::process::get_running,
                    api::process::get_available,
                    api::process::kill,
                    api::process::open_path,
                ],
            )
            .mount(
                "/api/settings",
                routes![
                    api::settings::get_settings,
                    api::settings::update_settings,
                    api::settings::set_run_at_startup,
                ],
            )
            .mount(
                "/api/system",
                routes![
                    api::system::get_static,
                    api::system::get_dynamic,
                    api::system::get_timeseries,
                ],
            )
            .manage(app_db_rocket)
            .manage(machine_store_rocket)
            .manage(settings_store_rocket)
            .manage(process_manager_rocket)
            .manage(startup_manager_rocket)
            .configure(rocket::Config {
                address: "127.0.0.1".parse().unwrap(),
                port: http_port,
                ..Default::default()
            })
            .launch()
            .await;
    });

    // Run the main metrics collection loop
    run_collector(machine_store).await;
}

/// Main metrics collection loop
/// Collects hardware and software metrics and updates the machine data store
async fn run_collector(machine_store: Arc<MachineDataStore>) {
    // Initialize NVML for GPU monitoring
    let nvml = match Nvml::init() {
        Ok(nvml) => Some(nvml),
        Err(e) => {
            warn!("NVML initialization failed (GPU monitoring disabled): {}", e);
            None
        }
    };

    let sys_stat = systemstat::System::new();
    let mut sys_info = sysinfo::System::new_all();
    sys_info.refresh_all();
    thread::sleep(SECOND);

    info!("Metrics collection started");

    loop {
        let start = SystemTime::now();

        sys_info.refresh_all();
        let time = chrono::Utc::now();

        // Collect all metrics in parallel
        let (cpu_util, mem_util, net_util, disk_usage, gpu_usage) = join!(
            cpu::get_cpu_util(&sys_info, &sys_stat),
            memory::get_mem_util(&sys_info),
            net::get_net_adapters(),
            disk::get_disk_util(&sys_info),
            gpu::get_gpu_util(&nvml),
        );

        // Convert to our DTO types and update store
        update_machine_store(
            &machine_store,
            cpu_util,
            mem_util,
            net_util,
            disk_usage,
            gpu_usage,
            &sys_info,
            &nvml,
            time,
        );

        // Log timing info
        if let Ok(elapsed) = start.elapsed() {
            info!("Metrics collection took: {:?}", elapsed);

            // Sleep for remaining time to maintain 1-second interval
            if elapsed.as_millis() < SECOND.as_millis() {
                thread::sleep(Duration::from_millis(
                    (SECOND.as_millis() - elapsed.as_millis()) as u64,
                ));
            }
        }
    }
}

/// Update the machine data store with collected metrics
fn update_machine_store(
    store: &MachineDataStore,
    cpu_util: Box<vital_service_api::models::CpuUsage>,
    mem_util: vital_service_api::models::MemoryUsage,
    net_util: Vec<vital_service_api::models::NetworkAdapterUsage>,
    disk_usage: Box<std::collections::HashMap<String, vital_service_api::models::DiskUsage>>,
    gpu_usage: Vec<vital_service_api::models::GpuUsage>,
    sys_info: &sysinfo::System,
    nvml: &Option<Nvml>,
    time: chrono::DateTime<chrono::Utc>,
) {
    // Convert CPU usage
    let cpu = models::CpuUsage {
        name: cpu_util.name.clone(),
        brand: cpu_util.brand.clone(),
        vendor_id: cpu_util.vendor_id.clone(),
        core_clocks_mhz: cpu_util.core_clocks_mhz.iter().map(|&v| v as i32).collect(),
        total_core_percentage: cpu_util.total_core_percentage,
        power_draw_wattage: cpu_util.power_draw_wattage,
        core_percentages: cpu_util.core_percentages.clone(),
        cpu_cache: None,
        temperature_readings: cpu_util.temperature_readings.clone().into_iter().collect(),
    };
    store.update_cpu(cpu);

    // Convert memory usage
    let memory = models::MemoryUsage {
        used_memory_bytes: mem_util.used_memory_bytes,
        total_visible_memory_bytes: mem_util.total_visible_memory_bytes,
        swap_percentage: mem_util.swap_percentage,
        swap_used_bytes: mem_util.swap_used_bytes,
        swap_total_bytes: mem_util.swap_total_bytes,
    };
    store.update_memory(memory);

    // Convert GPU usage
    let gpus: Vec<models::GpuUsage> = gpu_usage
        .iter()
        .map(|g| models::GpuUsage {
            name: g.name.clone(),
            temperature_readings: g.temperature_readings.clone().into_iter().collect(),
            device_index: g.device_index,
            part_number: g.part_number.clone(),
            total_memory_bytes: g.total_memory_bytes,
            memory_used_bytes: g.memory_used_bytes,
            clock_speeds: g.clock_speeds.as_ref().map(|cs| models::GpuClockSpeeds {
                memory_clock_mhz: cs.memory_clock_mhz,
                compute_clock_mhz: cs.compute_clock_mhz,
                graphics_clock_mhz: cs.graphics_clock_mhz,
                video_clock_mhz: cs.video_clock_mhz,
            }),
            fan_percentage: g.fan_percentage.clone().map(|f| f.into_iter().collect()),
            power_draw_watt: g.power_draw_watt,
            load: g.load.as_ref().map(|l| models::GpuLoadData {
                core_percentage: l.core_percentage,
                frame_buffer_percentage: l.frame_buffer_percentage,
                video_engine_percentage: l.video_engine_percentage,
                bus_interface_percentage: l.bus_interface_percentage,
                memory_used_percentage: l.memory_used_percentage,
                memory_controller_percentage: l.memory_controller_percentage,
                cuda_percentage: l.cuda_percentage,
                three_d_percentage: l.three_d_percentage,
            }),
            pcie: None,
        })
        .collect();
    store.update_gpu(gpus);

    // Collect process metrics
    #[cfg(any(target_os = "windows", target_os = "macos"))]
    {
        if let Some(process_data) = get_process_util(sys_info, nvml, time) {
            let mut cpu_usage = std::collections::HashMap::new();
            let mut ram_usage = std::collections::HashMap::new();
            let mut disk_activity = std::collections::HashMap::new();
            let mut gpu_usage_map = std::collections::HashMap::new();
            let mut running_processes: std::collections::HashMap<i32, models::ParentChildModelDto> =
                std::collections::HashMap::new();

            for p in &process_data {
                cpu_usage.insert(p.pid, p.cpu_percentage);
                ram_usage.insert(p.pid, p.memory_bytes as f32);
                disk_activity.insert(
                    p.pid,
                    (p.disk_usage.read_bytes_per_second + p.disk_usage.write_bytes_per_second) as f64,
                );
                if let Some(gpu) = &p.gpu_util {
                    if let Some(pct) = gpu.gpu_core_percentage {
                        gpu_usage_map.insert(p.pid, pct);
                    }
                }

                // Build process view data
                let process_view = models::ProcessViewDto {
                    process_name: p.name.clone(),
                    process_title: p.main_window_title.clone(),
                    description: p.description.clone(),
                    id: p.pid,
                };

                // Group by parent PID to create parent-child hierarchy
                if let Some(parent_pid) = p.parent_pid {
                    // This process has a parent
                    if let Some(parent_entry) = running_processes.get_mut(&parent_pid) {
                        // Add as child to existing parent
                        parent_entry.children.insert(p.pid, process_view);
                    } else {
                        // Parent not yet in map, add this as standalone for now
                        // It will be merged later if parent appears
                        running_processes.insert(
                            p.pid,
                            models::ParentChildModelDto {
                                parent: process_view,
                                children: std::collections::HashMap::new(),
                            },
                        );
                    }
                } else {
                    // This is a root process (no parent or parent is system)
                    if !running_processes.contains_key(&p.pid) {
                        running_processes.insert(
                            p.pid,
                            models::ParentChildModelDto {
                                parent: process_view,
                                children: std::collections::HashMap::new(),
                            },
                        );
                    }
                }
            }

            store.update_process_metrics(cpu_usage, ram_usage, disk_activity, gpu_usage_map);
            store.update_running_processes(running_processes);
        }
    }
}

struct SimpleLogger;

impl log::Log for SimpleLogger {
    fn enabled(&self, metadata: &Metadata) -> bool {
        metadata.level() <= Level::Info
    }

    fn log(&self, record: &Record) {
        if self.enabled(record.metadata()) {
            println!("{} - {}", record.level(), record.args());
        }
    }

    fn flush(&self) {}
}
