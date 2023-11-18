#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
mod commands;
mod file;
use crate::commands::commands::{
    get_client_settings, get_vital_service_ports, open_url, restart_vital_service,
    update_client_settings, update_vital_service_port, ServiceName,
};
use commands::commands::is_vital_service_running;
use commands::vital_service::start_vital_service;
use log::{debug, error, info, trace, warn};
use once_cell::sync::OnceCell;
use sentry::IntoDsn;
use std::io;
use std::sync::Mutex;

use tauri::{AppHandle, Manager};
use tauri::{
    CustomMenuItem, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem,
    SystemTraySubmenu,
};

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

    if cfg!(feature = "release") && !is_vital_service_running(ServiceName::VitalService) {
        let _ = start_vital_service(ServiceName::VitalService);
    }

    tauri::Builder::default()
        .setup(|app| {
            let set_handle = APP_HANDLE.set(Mutex::new(app.handle()));
            if set_handle.is_err() {
                error!("Failed to set app handle in once cell");
            }
            let window = app.get_window("main");
            if window.is_none() {
                error!("Failed to get window");
                panic!("Failed to get window");
            }
            let always_on_top = match get_client_settings() {
                Ok(settings) => settings.always_on_top,
                Err(e) => {
                    error!("Failed to get client settings: {}", e);
                    true
                }
            };
            let result = window.unwrap().set_always_on_top(always_on_top);
            match result {
                Ok(_) => {
                    debug!("Set always on top to: {}", always_on_top);
                }
                Err(e) => {
                    error!("Failed to set always on top: {}", e);
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_client_settings,
            update_client_settings,
            get_vital_service_ports,
            restart_vital_service,
            update_vital_service_port,
            open_url
        ])
        .system_tray(system_tray_setup())
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
                "alwaysOnTop_enable" => match get_client_settings() {
                    Ok(settings) => {
                        let mut settings = settings;
                        settings.always_on_top = true;
                        let _ = update_client_settings(settings);
                    }
                    Err(e) => {
                        error!("Failed to get client settings: {}", e);
                    }
                },
                "alwaysOnTop_disable" => match get_client_settings() {
                    Ok(settings) => {
                        let mut settings = settings;
                        settings.always_on_top = false;
                        let _ = update_client_settings(settings);
                    }
                    Err(e) => {
                        error!("Failed to get client settings: {}", e);
                    }
                },
                _ => {}
            },
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn system_tray_setup() -> SystemTray {
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
    return SystemTray::new().with_menu(tray_menu);
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
