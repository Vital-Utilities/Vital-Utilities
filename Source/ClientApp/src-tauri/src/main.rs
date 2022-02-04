#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
mod backend_types;

use log::{debug, error, info, trace, warn};
use sentry::IntoDsn;
use std::convert::TryInto;
use std::io;
use std::os::windows::process::CommandExt;
use sysinfo::{ProcessExt, System, SystemExt};
use tauri::api::path::document_dir;

use std::process::Command;
use tauri::{AppHandle, Manager};
use tauri::{
    CustomMenuItem, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem,
    SystemTraySubmenu,
};

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
        // here `"quit".to_string()` defines the menu item id, and the second parameter is the menu item label.
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

    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let always_on_top_menu = SystemTrayMenu::new()
        .add_item(CustomMenuItem::new(
            "alwaysOnTop_enable".to_string(),
            "enable",
        ))
        .add_item(CustomMenuItem::new(
            "alwaysOnTop_disable".to_string(),
            "disable",
        ));
    let always_on_top = SystemTraySubmenu::new("alwaysOnTop".to_string(), always_on_top_menu);

    let mut _restart_backend = CustomMenuItem::new("restartBackend".to_string(), "Restart Backend");
    _restart_backend.enabled = cfg!(feature = "release");
    let tray_menu = SystemTrayMenu::new()
        .add_item(_restart_backend)
        .add_submenu(always_on_top)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(quit);

    let tray = SystemTray::new().with_menu(tray_menu);

    if cfg!(feature = "release") && !is_vital_service_running() {
        let _ = start_vital_service();
    }

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_vital_service_ports,
            restart_vital_service,
            update_vital_service_port,
            open_url
        ])
        .system_tray(tray)
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::LeftClick {
                position: _,
                size: _,
                ..
            } => {
                debug!("system tray received a left click");
            }
            SystemTrayEvent::RightClick {
                position: _,
                size: _,
                ..
            } => {
                debug!("system tray received a right click");
            }
            SystemTrayEvent::DoubleClick {
                position: _,
                size: _,
                ..
            } => {
                debug!("system tray received a double click");
            }
            SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "quit" => {
                    app.exit(0);
                }
                "restartBackend" => {
                    let _ = restart_vital_service();
                }
                "alwaysOnTop_enable" => {
                    set_always_on_top(app, true);
                }
                "alwaysOnTop_disable" => {
                    set_always_on_top(app, false);
                }
                _ => {}
            },
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn set_always_on_top(app: &AppHandle, value: bool) {
    let window = app.get_window("main").unwrap();
    let result = window.set_always_on_top(value);
    if result.is_err() {
        error!("failed to set always on top. {:?}", result.unwrap_err());
    }
}

fn end_process(pid: u32) -> Result<(), String> {
    if !cfg!(feature = "release") {
        info!("Debug mode: not killing process with pid: {}", pid);
        return Err("Debug mode: not killing process".to_string());
    }

    info!("Killing process with pid: {}", pid);
    let s = System::new_all();
    let process = s.process(pid.try_into().unwrap());
    match process {
        Some(process) => {
            let result = process.kill();
            if result == false {
                error!("failed to terminate process. {:?}", pid);
                return Err("failed to terminate process".to_string());
            }
            return Ok(());
        }
        None => {
            info!("process not found. {:?}", pid);
            return Err("process not found".to_string());
        }
    }
}

// function uses winapi to get process of given pid and kills it.

fn start_vital_service() -> Result<String, String> {
    if !cfg!(feature = "release") {
        info!("Debug mode: backend will not be started");
        return Ok("Debug mode: backend will not be started".to_string());
    }

    info!("Starting Vital Service");
    const CREATE_NO_WINDOW: u32 = 0x08000000;
    let result = Command::new("cmd")
        .args(&["/C", "start", "./bin/Backend/VitalService.exe"])
        .creation_flags(CREATE_NO_WINDOW)
        .spawn();

    match result {
        Ok(_) => {
            info!("Vital Service started");
            return Ok("Vital Service started".to_string());
        }
        Err(err) => {
            error!("Failed to start Vital Service: {:?}", err);
            return Err(format!("Failed to start Vital Service: {:?}", err));
        }
    }
}

fn is_vital_service_running() -> bool {
    let s = System::new_all();
    for _process in s.process_by_name("VitalService") {
        return true;
    }
    return false;
}

fn get_running_vital_service_pid() -> Option<usize> {
    let s = System::new_all();
    for _process in s.process_by_name("VitalService") {
        return Some(_process.pid());
    }
    return None;
}

#[tauri::command]
fn restart_vital_service() -> Result<String, String> {
    if !cfg!(feature = "release") {
        let msg = "Debug mode: backend will not be restarted".to_string();
        info!("{}", msg);
        return Err(msg);
    }

    match get_running_vital_service_pid() {
        Some(pid) => {
            info!("Found an existing Vital Service instance running, killing it");
            let end_process_result = end_process(pid as u32);

            if end_process_result.is_err() {
                return Err(end_process_result.unwrap_err());
            }

            return start_vital_service();
        }
        None => {
            return start_vital_service();
        }
    }
}

#[tauri::command]
fn get_vital_service_ports() -> Result<backend_types::LaunchSettings, String> {
    let document_dir = document_dir();
    match document_dir {
        Some(dir) => {
            let file_path = dir.join(r#"Vital Utilities\Settings.json"#);

            let settings_file = std::fs::read_to_string(file_path);
            match settings_file {
                Ok(settings_str) => {
                    let settings =
                        serde_json::from_str::<backend_types::SettingsDto>(&settings_str);
                    match settings {
                        Ok(settings) => {
                            return Ok(settings.launch);
                        }
                        Err(e) => {
                            error!("{}", e);
                            return Err(format!("{}", e));
                        }
                    }
                }
                Err(e) => {
                    error!("{}", e);
                    return Err(format!("{}", e));
                }
            }
        }
        None => {
            let msg = "failed to get document dir".to_string();
            error!("{}", msg);
            return Err(msg);
        }
    }
}

#[tauri::command]
fn update_vital_service_port(port_number: f64) -> Result<String, String> {
    if !cfg!(feature = "release") {
        let msg = "Debug mode: vital service port will not be updated".to_string();
        info!("{}", msg);
        return Err(msg);
    }

    let document_dir = document_dir();
    match document_dir {
        Some(dir) => {
            let file_path = dir.join(r#"Vital Utilities\Settings.json"#);

            let settings_file = std::fs::read_to_string(&file_path);
            match settings_file {
                Ok(settings_str) => {
                    let settings =
                        serde_json::from_str::<backend_types::SettingsDto>(&settings_str);
                    match settings {
                        Ok(mut settings) => {
                            settings.launch.vital_service_https_port = port_number;

                            let result = std::fs::write(
                                &file_path,
                                serde_json::to_string(&settings).unwrap(),
                            );
                            match result {
                                Ok(_) => {
                                    let msg = format!(
                                        "Successfully updated vital service port to {}",
                                        port_number
                                    );

                                    info!("{}", msg);
                                    return Ok(msg);
                                }
                                Err(e) => {
                                    let msg = format!("Failed to update vital service port. {}", e);
                                    error!("{}", msg);
                                    return Err(msg);
                                }
                            }
                        }
                        Err(e) => {
                            error!("{}", e);
                            return Err(format!("{}", e));
                        }
                    }
                }
                Err(e) => {
                    error!("{}", e);
                    return Err(format!("{}", e));
                }
            }
        }
        None => {
            let msg = "failed to get document directory".to_string();
            error!("{}", msg);
            return Err(msg);
        }
    }
}

#[tauri::command]
fn open_url(url: &str) -> Result<(), String> {
    let result = webbrowser::open(url);

    match result {
        Ok(_) => {
            info!("Opened url: {}", url);
            return Ok(());
        }
        Err(e) => {
            error!("Failed to open url: {}", e);
            return Err(format!("Failed to open url: {}", e));
        }
    }
}

fn setup_logging(verbosity: u64) -> Result<(), fern::InitError> {
    let mut base_config = fern::Dispatch::new();

    base_config = match verbosity {
        0 => {
            // Let's say we depend on something which whose "info" level messages are too
            // verbose to include in end-user output. If we don't need them,
            // let's not include them.
            base_config
                .level(log::LevelFilter::Info)
                .level_for("overly-verbose-target", log::LevelFilter::Warn)
        }
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
            // special format for debug messages coming from our own crate.
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
