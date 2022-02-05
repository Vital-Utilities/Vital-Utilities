use std::{convert::TryInto, os::windows::process::CommandExt, process::Command};

use log::{error, info};
use sysinfo::{ProcessExt, System, SystemExt};
use tauri::api::path::document_dir;

use crate::{
    backend_types::{LaunchSettings, SettingsDto},
    settings::get_backend_settings,
};

#[tauri::command]
pub fn restart_vital_service() -> Result<String, String> {
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
        }
        None => {}
    }
    return start_vital_service();
}

#[tauri::command]
pub fn get_vital_service_ports() -> Result<LaunchSettings, String> {
    let settings_file = get_backend_settings();
    match settings_file {
        Ok(settings) => {
            return Ok(settings.launch);
        }
        Err(e) => {
            error!("{}", e);
            return Err(format!("{}", e));
        }
    }
}

#[tauri::command]
pub fn update_vital_service_port(port_number: f64) -> Result<String, String> {
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
                    let settings = serde_json::from_str::<SettingsDto>(&settings_str);
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
pub fn open_url(url: &str) -> Result<(), String> {
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

pub fn end_process(pid: u32) -> Result<(), String> {
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

pub fn start_vital_service() -> Result<String, String> {
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

pub fn is_vital_service_running() -> bool {
    let s = System::new_all();
    for _process in s.process_by_name("VitalService") {
        return true;
    }
    return false;
}

pub fn get_running_vital_service_pid() -> Option<usize> {
    let s = System::new_all();
    for _process in s.process_by_name("VitalService") {
        return Some(_process.pid());
    }
    return None;
}
