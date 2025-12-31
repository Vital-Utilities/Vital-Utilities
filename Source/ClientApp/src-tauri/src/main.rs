#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod commands;
mod file;

// Backend modules (embedded VitalRustService)
mod db;
mod machine_stats;
mod models;
mod nvidia;
mod platform;
mod services;
mod software;
mod stores;

use crate::commands::api_commands;
use crate::commands::commands::{
    get_client_settings, get_os, get_vital_service_ports, open_url, update_client_settings,
    update_vital_service_port,
};
use crate::db::{get_app_db_path, AppDb};
use crate::platform::{create_process_manager, create_startup_manager, ProcessManager, StartupManager};
use crate::services::MetricsStorageService;
use crate::stores::{MachineDataStore, SettingsStore};

use log::{debug, error, info, warn};
use nvml_wrapper::Nvml;
use once_cell::sync::OnceCell;
use sentry::IntoDsn;
use std::io;
use std::sync::{Arc, Mutex};
use std::time::Duration;

use tauri::{
    async_runtime,
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager, RunEvent,
};
use tauri_plugin_autostart::MacosLauncher;
use tokio::join;

static APP_HANDLE: OnceCell<Mutex<AppHandle>> = OnceCell::new();

fn main() {
    if cfg!(feature = "release") {
        log::set_max_level(log::LevelFilter::Error);
    } else {
        log::set_max_level(log::LevelFilter::Trace);
    }

    let logging = setup_logging(3);
    match logging {
        Ok(_) => {}
        Err(e) => {
            error!("Failed to setup logging: {}", e);
        }
    }

    let _guard;
    if cfg!(feature = "release") {
        let dsn = "REPLACE_WITH_SENTRYIO_RUST_DSN".into_dsn();
        match dsn {
            Ok(dsn) => match dsn {
                Some(dsn) => {
                    _guard = sentry::init((
                        dsn,
                        sentry::ClientOptions {
                            release: sentry::release_name!(),
                            ..Default::default()
                        },
                    ));
                    sentry::configure_scope(|scope| {
                        scope.set_user(Some(sentry::User {
                            ip_address: Some(sentry::protocol::IpAddress::Auto),
                            id: None,
                            ..Default::default()
                        }))
                    });
                    info!("Sentry initialized");
                }
                None => {
                    error!("No DSN provided");
                }
            },
            Err(err) => {
                error!("Failed to parse sentry DSN: {}", err);
            }
        }
    }

    // Build the Tauri app
    let app = tauri::Builder::default()
        // Add autostart plugin for run at login
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ))
        // Add shell plugin
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let handle = app.handle().clone();
            let set_handle = APP_HANDLE.set(Mutex::new(handle.clone()));
            if set_handle.is_err() {
                error!("Failed to set app handle in once cell");
            }

            let window = app.get_webview_window("main");
            if window.is_none() {
                error!("Failed to get window");
                panic!("Failed to get window");
            }

            // Always on top is permanently disabled
            let _ = window.unwrap().set_always_on_top(false);

            // Set up system tray
            setup_tray(app)?;

            // Initialize backend services and state
            info!("Initializing backend services...");

            // Use async_runtime to initialize async resources
            let handle_clone = handle.clone();
            async_runtime::spawn(async move {
                initialize_backend(handle_clone).await;
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Client settings commands
            get_client_settings,
            update_client_settings,
            get_vital_service_ports,
            update_vital_service_port,
            open_url,
            get_os,
            // API commands (replaces Rocket HTTP endpoints)
            api_commands::api_hello,
            api_commands::get_system_static,
            api_commands::get_system_dynamic,
            api_commands::get_system_timeseries,
            api_commands::get_processes,
            api_commands::get_managed_processes,
            api_commands::get_running_processes,
            api_commands::get_processes_to_add,
            api_commands::kill_process,
            api_commands::open_process_path,
            api_commands::get_all_profiles,
            api_commands::get_profile,
            api_commands::create_profile,
            api_commands::update_profile,
            api_commands::delete_profile,
            api_commands::add_process_config,
            api_commands::update_process_config,
            api_commands::delete_process_config,
            api_commands::get_settings,
            api_commands::update_settings,
            api_commands::set_run_at_startup,
        ])
        // Handle window close event to minimize to tray instead of closing
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                // Prevent window from closing, hide to tray instead
                let _ = window.hide();
                api.prevent_close();
            }
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    // Run the app with custom event handling
    app.run(|_app_handle, event| {
        if let RunEvent::ExitRequested { api, .. } = event {
            // Prevent app from exiting when all windows are closed
            // This allows the app to continue running in the background
            api.prevent_exit();
        }
    });
}

/// Initialize backend services and manage state
async fn initialize_backend(handle: AppHandle) {
    info!("Starting embedded backend service...");

    // Initialize settings store
    let settings_store = Arc::new(SettingsStore::new());

    // Initialize app database (for profiles only)
    let app_db = match AppDb::connect(&get_app_db_path()).await {
        Ok(db) => Arc::new(db),
        Err(e) => {
            error!("Failed to connect to app database: {:?}", e);
            panic!("Database connection failed");
        }
    };

    // Initialize machine data store (in-memory only, no database)
    let machine_store = Arc::new(MachineDataStore::new());

    // Initialize platform managers
    let process_manager: Arc<dyn ProcessManager> = Arc::from(create_process_manager());
    let startup_manager: Arc<dyn StartupManager> = Arc::from(create_startup_manager());

    // Register state with Tauri
    handle.manage(app_db.clone());
    handle.manage(machine_store.clone());
    handle.manage(settings_store.clone());
    handle.manage(process_manager.clone());
    handle.manage(startup_manager.clone());

    // Start background services (in-memory metrics storage only)
    let metrics_service = MetricsStorageService::new(
        machine_store.clone(),
        settings_store.clone(),
    );
    tokio::spawn(async move {
        metrics_service.run().await;
    });

    // Start config applyer (applies process affinity/priority) - Windows only
    #[cfg(target_os = "windows")]
    {
        use crate::services::ConfigApplyerService;
        let config_applyer = ConfigApplyerService::new(app_db.clone(), process_manager.clone());
        tokio::spawn(async move {
            config_applyer.run().await;
        });
    }

    // Run the main metrics collection loop
    run_collector(machine_store).await;
}

/// Main metrics collection loop
/// Collects hardware and software metrics and updates the machine data store
async fn run_collector(machine_store: Arc<MachineDataStore>) {
    use crate::machine_stats::{cpu, disk, gpu, memory, net, power};
    use systemstat::Platform; // Import Platform trait for System::new()

    static SECOND: Duration = Duration::from_millis(1000);

    // Initialize NVML for GPU monitoring
    let nvml = match Nvml::init() {
        Ok(nvml) => Some(nvml),
        Err(e) => {
            warn!(
                "NVML initialization failed (GPU monitoring disabled): {}",
                e
            );
            None
        }
    };

    let sys_stat = systemstat::System::new();
    let mut sys_info = sysinfo::System::new_all();
    sys_info.refresh_all();
    tokio::time::sleep(SECOND).await;

    // Initialize static CPU data (only needs to be done once)
    machine_store.init_static_cpu(&sys_info);

    // Get initial GPU data to populate static GPU info
    let initial_gpu_usage = gpu::get_gpu_util(&nvml).await;
    let initial_gpus: Vec<crate::models::GpuUsage> = initial_gpu_usage
        .iter()
        .map(|g| crate::models::GpuUsage {
            name: g.name.clone(),
            temperature_readings: g.temperature_readings.clone().into_iter().collect(),
            device_index: g.device_index,
            part_number: g.part_number.clone(),
            total_memory_bytes: g.total_memory_bytes,
            memory_used_bytes: g.memory_used_bytes,
            clock_speeds: g.clock_speeds.as_ref().map(|cs| crate::models::GpuClockSpeeds {
                memory_clock_mhz: cs.memory_clock_mhz,
                compute_clock_mhz: cs.compute_clock_mhz,
                graphics_clock_mhz: cs.graphics_clock_mhz,
                video_clock_mhz: cs.video_clock_mhz,
            }),
            fan_percentage: g.fan_percentage.clone().map(|f| f.into_iter().collect()),
            power_draw_watt: g.power_draw_watt,
            load: g.load.as_ref().map(|l| crate::models::GpuLoadData {
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
    machine_store.init_static_gpu(&initial_gpus);

    // Initialize static RAM data
    machine_store.init_static_ram(&sys_info);

    info!("Metrics collection started");

    loop {
        let start = std::time::SystemTime::now();

        sys_info.refresh_all();
        let time = chrono::Utc::now();

        // Collect all metrics in parallel
        let (cpu_util, mem_util, _net_util, disk_usage, gpu_usage, power_info) = join!(
            cpu::get_cpu_util(&sys_info, &sys_stat),
            memory::get_mem_util(&sys_info),
            net::get_net_adapters(),
            disk::get_disk_util(&sys_info),
            gpu::get_gpu_util(&nvml),
            power::get_power_info(),
        );

        // Convert to our DTO types and update store
        update_machine_store(&machine_store, cpu_util, mem_util, gpu_usage, disk_usage, power_info, &sys_info, time);

        // Sleep for remaining time to maintain ~1-second interval
        if let Ok(elapsed) = start.elapsed() {
            // Use tokio::time::sleep instead of std::thread::sleep to avoid blocking the async runtime
            if elapsed.as_millis() < SECOND.as_millis() {
                tokio::time::sleep(Duration::from_millis(
                    (SECOND.as_millis() - elapsed.as_millis()) as u64,
                )).await;
            }
        }
    }
}

/// Update the machine data store with collected metrics
fn update_machine_store(
    store: &MachineDataStore,
    cpu_util: Box<vital_service_api::models::CpuUsage>,
    mem_util: vital_service_api::models::MemoryUsage,
    gpu_usage: Vec<vital_service_api::models::GpuUsage>,
    disk_usage: Box<std::collections::HashMap<String, vital_service_api::models::DiskUsage>>,
    power_info: crate::machine_stats::power::PowerUsage,
    sys_info: &sysinfo::System,
    _time: chrono::DateTime<chrono::Utc>,
) {
    use crate::models;
    use std::collections::HashMap;

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

    // Convert disk usage - use the nested structure matching our DiskUsage DTO
    let disks: HashMap<String, models::DiskUsage> = disk_usage
        .iter()
        .map(|(mount_point, d)| {
            let disk = models::DiskUsage {
                name: d.name.clone(),
                serial: d.serial.clone(),
                unique_identifier: d.unique_identifier.clone(),
                drive_type: Some(format!("{:?}", d.drive_type)),
                disk_type: Some(format!("{:?}", d.disk_type)),
                throughput: d.throughput.as_ref().map(|t| models::DiskThroughput {
                    read_rate_bytes_per_second: t.read_rate_bytes_per_second,
                    write_rate_bytes_per_second: t.write_rate_bytes_per_second,
                }),
                load: Some(models::DiskLoad {
                    used_space_percentage: d.load.used_space_percentage,
                    used_space_bytes: d.load.used_space_bytes,
                    total_space_bytes: d.load.total_space_bytes,
                    write_activity_percentage: d.load.write_activity_percentage,
                    total_activity_percentage: d.load.total_activity_percentage,
                }),
                temperatures: Some(d.temperatures.clone()),
                disk_health: d.disk_health.as_ref().map(|h| models::DiskHealth {
                    total_bytes_read: h.total_bytes_read.map(|v| v as u64),
                    total_bytes_written: h.total_bytes_written.map(|v| v as u64),
                }),
                volume_label: d.volume_label.clone(),
                letter: d.letter.clone(),
            };
            (mount_point.clone(), disk)
        })
        .collect();
    store.update_disks(models::DiskUsages { disks });

    // Convert power/battery data
    let power = models::PowerUsage {
        battery_installed: power_info.battery_installed,
        battery_percentage: power_info.battery_percentage,
        fully_charged: power_info.fully_charged,
        external_connected: power_info.external_connected,
        system_power_watts: power_info.system_power_watts,
        battery_power_watts: power_info.battery_power_watts,
        battery_voltage: power_info.battery_voltage,
        battery_amperage: power_info.battery_amperage,
        cycle_count: power_info.cycle_count,
        design_capacity_mah: power_info.design_capacity_mah,
        max_capacity_mah: power_info.max_capacity_mah,
        battery_health: power_info.battery_health,
        time_remaining_minutes: power_info.time_remaining_minutes,
        adapter_watts: power_info.adapter_watts,
        adapter_voltage: power_info.adapter_voltage,
        adapter_description: power_info.adapter_description,
    };
    store.update_power(power);

    // Collect and update running processes
    // Build a map of all processes first
    let mut all_processes: HashMap<i32, models::ProcessViewDto> = HashMap::new();
    let mut parent_map: HashMap<i32, i32> = HashMap::new(); // child_pid -> parent_pid

    for (pid, process) in sys_info.processes() {
        let pid_i32 = pid.as_u32() as i32;
        // In sysinfo 0.37+, process.name() returns &OsStr, convert to String
        let process_name = process.name().to_string_lossy().to_string();
        let process_view = models::ProcessViewDto {
            process_name: process_name.clone(),
            // Set process_title so it shows up when "Show all Processes" is unchecked
            process_title: Some(process_name),
            description: None,
            id: pid_i32,
        };
        all_processes.insert(pid_i32, process_view);

        if let Some(parent_pid) = process.parent() {
            let parent_pid_i32 = parent_pid.as_u32() as i32;
            // Only track parent relationship if parent exists in our process list
            // and is not a system process (pid 0 or 1)
            if parent_pid_i32 > 1 {
                parent_map.insert(pid_i32, parent_pid_i32);
            }
        }
    }

    // Build the result - only include top-level processes (those without parents in our list)
    let mut running_processes: HashMap<i32, models::ParentChildModelDto> = HashMap::new();

    // Collect children for each potential parent
    let mut children_map: HashMap<i32, HashMap<i32, models::ProcessViewDto>> = HashMap::new();
    for (child_pid, parent_pid) in &parent_map {
        if all_processes.contains_key(parent_pid) {
            if let Some(child_view) = all_processes.get(child_pid) {
                children_map
                    .entry(*parent_pid)
                    .or_insert_with(HashMap::new)
                    .insert(*child_pid, child_view.clone());
            }
        }
    }

    // Create entries for top-level parents only
    for (pid, process_view) in &all_processes {
        // A process is top-level if it has no parent in our process list
        let has_parent_in_list = parent_map.get(pid)
            .map(|ppid| all_processes.contains_key(ppid))
            .unwrap_or(false);

        if !has_parent_in_list {
            let children = children_map.remove(pid).unwrap_or_default();
            running_processes.insert(*pid, models::ParentChildModelDto {
                parent: process_view.clone(),
                children,
            });
        }
    }

    store.update_running_processes(running_processes);
}

fn setup_tray(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    // Create menu items
    let show_i = MenuItem::with_id(app, "show", "Show", true, None::<&str>)?;
    let hide_i = MenuItem::with_id(app, "hide", "Hide", true, None::<&str>)?;
    let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

    let menu = Menu::with_items(
        app,
        &[
            &show_i,
            &hide_i,
            &quit_i,
        ],
    )?;

    let _tray = TrayIconBuilder::new()
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(move |app, event| match event.id.as_ref() {
            "quit" => {
                app.exit(0);
            }
            "show" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.unminimize();
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            "hide" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.hide();
                }
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                // Show window on left click
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.unminimize();
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .build(app)?;

    Ok(())
}

fn setup_logging(verbosity: u64) -> Result<(), fern::InitError> {
    let mut base_config = fern::Dispatch::new();

    // Filter out noisy modules
    base_config = base_config
        .level_for("sqlx", log::LevelFilter::Warn)
        .level_for("sqlx::query", log::LevelFilter::Warn)
        .level_for("hyper", log::LevelFilter::Warn)
        .level_for("tao", log::LevelFilter::Warn)
        .level_for("wry", log::LevelFilter::Warn)
        .level_for("tracing", log::LevelFilter::Warn);

    base_config = match verbosity {
        0 => base_config
            .level(log::LevelFilter::Info)
            .level_for("overly-verbose-target", log::LevelFilter::Warn),
        1 => base_config
            .level(log::LevelFilter::Debug)
            .level_for("overly-verbose-target", log::LevelFilter::Info),
        2 => base_config.level(log::LevelFilter::Debug),
        _3_or_more => base_config.level(log::LevelFilter::Trace),
    };

    // Separate file config so we can include year, month and day in file logs
    let file_config = fern::Dispatch::new()
        .format(|out, message, record| {
            out.finish(format_args!(
                "{}[{}][{}] {}",
                chrono::Local::now().format("[%Y-%m-%d][%H:%M:%S]"),
                record.target(),
                record.level(),
                message
            ))
        })
        .chain(fern::log_file("VitalUtilities.log")?);

    let stdout_config = fern::Dispatch::new()
        .format(|out, message, record| {
            if record.level() > log::LevelFilter::Info && record.target() == "cmd_program" {
                out.finish(format_args!(
                    "---\nDEBUG: {}: {}\n---",
                    chrono::Local::now().format("%H:%M:%S"),
                    message
                ))
            } else {
                out.finish(format_args!(
                    "[{}][{}][{}] {}",
                    chrono::Local::now().format("%H:%M"),
                    record.target(),
                    record.level(),
                    message
                ))
            }
        })
        .chain(io::stdout());

    base_config
        .chain(file_config)
        .chain(stdout_config)
        .apply()?;

    Ok(())
}
