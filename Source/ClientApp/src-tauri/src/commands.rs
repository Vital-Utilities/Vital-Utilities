use std::{convert::TryInto, os::windows::process::CommandExt, process::Command, sync::Mutex};

use crate::{
    backend_types::{self, ClientSettings, LaunchSettings, SettingsDto},
    APP_HANDLE,
};
use log::{debug, error, info};
use sysinfo::{ProcessExt, System, SystemExt};
use tauri::{api::path::document_dir, AppHandle, Manager};

#[tauri::command]
pub fn get_client_settings() -> Result<ClientSettings, String> {
    let document_dir = document_dir();
    if document_dir.is_none() {
        let msg = "failed to get document dir".to_string();
        error!("{}", msg);
        return Err(msg);
    }
    let file_path = &document_dir
        .unwrap()
        .join(r#"Vital Utilities\ClientSettings.json"#);

    let settings_file = std::fs::read_to_string(file_path);
    if settings_file.is_err() {
        error!("Failed to read ClientSettings file, Creating new ClientSettings File");
        let settings = backend_types::ClientSettings {
            always_on_top: true,
        };
        let content = serde_json::to_string(&settings);
        if content.is_err() {
            error!("failed to serialize new ClientSettings");
            return Err("failed to serialize new ClientSettings".to_string());
        }
        match std::fs::write(file_path, content.unwrap()) {
            Ok(_) => {
                info!("Created new ClientSettings file");
                return Ok(settings);
            }
            Err(e) => {
                error!("Failed to write client settings: {}", e);
                return Err(format!("{}", e));
            }
        }
    }

    let settings = serde_json::from_str::<backend_types::ClientSettings>(&settings_file.unwrap());
    match settings {
        Ok(settings) => {
            debug!("Successfully read client settings");
            return Ok(settings);
        }
        Err(e) => {
            error!("{}", e);
            return Err(format!("{}", e));
        }
    }
}

#[tauri::command]
pub fn update_client_settings(client_settings: ClientSettings) -> Result<String, String> {
    match document_dir() {
        Some(dir) => {
            let file_path = dir.join(r#"Vital Utilities\ClientSettings.json"#);

            let result =
                std::fs::write(&file_path, serde_json::to_string(&client_settings).unwrap());
            match result {
                Ok(_) => {
                    let msg = "Successfully updated client settings file";

                    info!("{}", msg);
                    let handle = APP_HANDLE.get();
                    if handle.is_none() {
                        error!("Failed to get app handle, app must restart to apply new settings");
                        return Err(msg.to_string());
                    }

                    let guard = handle.unwrap().lock().unwrap();
                    let _ = set_always_on_top(&guard, client_settings.always_on_top);
                    std::mem::drop(guard);
                    return Ok(msg.to_string());
                }
                Err(e) => {
                    let msg = format!("Failed to update client settings file. {}", e);
                    error!("{}", msg);
                    return Err(msg);
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

pub fn get_backend_settings() -> Result<backend_types::SettingsDto, String> {
    let document_dir = document_dir();
    if document_dir.is_none() {
        let msg = "failed to get document dir".to_string();
        error!("{}", msg);
        return Err(msg);
    }
    let file_path = document_dir
        .unwrap()
        .join(r#"Vital Utilities\Settings.json"#);

    let settings_file = std::fs::read_to_string(file_path);
    if settings_file.is_err() {
        let msg = "failed to read settings file".to_string();
        error!("{}", msg);
        return Err(msg);
    }

    let settings = serde_json::from_str::<backend_types::SettingsDto>(&settings_file.unwrap());
    match settings {
        Ok(settings) => {
            return Ok(settings);
        }
        Err(e) => {
            error!("{}", e);
            return Err(format!("{}", e));
        }
    }
}

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

pub fn set_always_on_top(app: &AppHandle, value: bool) -> Result<(), String> {
    let window = app.get_window("main").unwrap();
    match window.set_always_on_top(value) {
        Ok(_) => {
            debug!("Set always on top to: {}", value);
            return Ok(());
        }
        Err(e) => {
            error!("Failed to set always on top: {}", e);
            return Err(format!("{}", e));
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
        .args(&["/C", "start", "./bin/VitalService/VitalService.exe"])
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
