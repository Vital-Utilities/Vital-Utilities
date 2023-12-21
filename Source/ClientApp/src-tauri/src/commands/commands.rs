use std::{io::Error, path::PathBuf};

use crate::APP_HANDLE;
use log::{debug, error, info};
use sysinfo::{Pid, System};
use tauri::{api::path::document_dir, AppHandle, Manager};
use vital_service_api::models::{ClientSettings, LaunchSettings, SettingsDto};

use super::vital_service::start_vital_service;

#[cfg(target_os = "windows")]
use {
    crate::file::get_process_path,
    std::{convert::TryInto, os::windows::process::CommandExt, process::Command, sync::Mutex},
    winapi::um::processthreadsapi::OpenProcess,
    winapi::um::winnt::PROCESS_ALL_ACCESS,
};

fn client_settings_path() -> Result<PathBuf, Error> {
    let document_dir = document_dir();
    if document_dir.is_none() {
        let msg = "failed to get document dir".to_string();
        error!("{}", msg);
        return Err(Error::new(std::io::ErrorKind::Other, msg));
    }
    let path = &document_dir
        .unwrap()
        .join(r#"Vital Utilities"#)
        .join(r#"ClientSettings.json"#);
    Ok(path.to_owned())
}

#[tauri::command]
pub fn get_client_settings() -> Result<ClientSettings, String> {
    let file_path = client_settings_path().expect("Failed to get documentDir");

    info!("{}", file_path.display());
    let settings_file = std::fs::read_to_string(&file_path);
    if settings_file.is_err() {
        error!("Failed to read ClientSettings file, Creating new ClientSettings File");
        let settings = ClientSettings {
            always_on_top: true,
        };
        let content = serde_json::to_string(&settings);
        if content.is_err() {
            error!("failed to serialize new ClientSettings");
            return Err("failed to serialize new ClientSettings".to_string());
        }
        match std::fs::write(&file_path, content.unwrap()) {
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

    let settings = serde_json::from_str::<ClientSettings>(&settings_file.unwrap());
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
    let file_path = client_settings_path().expect("Failed to get documentDir");
    let result = std::fs::write(&file_path, serde_json::to_string(&client_settings).unwrap());
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

pub fn get_backend_settings() -> Result<SettingsDto, String> {
    let document_dir = document_dir();
    if document_dir.is_none() {
        let msg = "failed to get document dir".to_string();
        error!("{}", msg);
        return Err(msg);
    }
    let file_path = document_dir
        .unwrap()
        .join(r#"Vital Utilities"#)
        .join(r#"Settings.json"#);

    let settings_file = std::fs::read_to_string(file_path);
    if settings_file.is_err() {
        let msg = "failed to read settings file".to_string();
        error!("{}", msg);
        return Err(msg);
    }

    let settings = serde_json::from_str::<SettingsDto>(&settings_file.unwrap());
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

    match get_running_vital_service_pid(ServiceName::VitalService) {
        Some(pid) => {
            info!("Found an existing Vital Service instance running, killing it");
            let end_process_result = end_process(pid);

            if end_process_result.is_err() {
                return Err(end_process_result.unwrap_err());
            }
        }
        None => {}
    }
    return start_vital_service(ServiceName::VitalService);
}

#[tauri::command]
pub fn get_vital_service_ports() -> Result<LaunchSettings, String> {
    let settings_file = get_backend_settings();
    match settings_file {
        Ok(settings) => {
            return Ok(*settings.launch);
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

    let file_path = client_settings_path().expect("Failed to get documentDir");
    let settings_file = std::fs::read_to_string(&file_path);
    match settings_file {
        Ok(settings_str) => {
            let settings = serde_json::from_str::<SettingsDto>(&settings_str);
            match settings {
                Ok(mut settings) => {
                    settings.launch.vital_service_http_port = port_number as i32;

                    let result =
                        std::fs::write(&file_path, serde_json::to_string(&settings).unwrap());
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

#[tauri::command]
pub fn get_os() -> Result<String, String> {
    let os = std::env::consts::OS;
    debug!("{}", os.to_string());
    return Ok(os.to_string());
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

pub fn end_process(pid: Pid) -> Result<(), String> {
    if !cfg!(feature = "release") {
        info!("Debug mode: not killing process with pid: {}", pid);
        return Err("Debug mode: not killing process".to_string());
    }

    info!("Killing process with pid: {}", pid);
    let s = System::new_all();
    let process = s.process(pid);
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
pub fn is_vital_service_running(service_name: ServiceName) -> bool {
    let s = System::new_all();
    for _process in s.processes_by_exact_name(service_name.as_str()) {
        return true;
    }
    return false;
}

pub fn get_running_vital_service_pid(service_name: ServiceName) -> Option<Pid> {
    let s = System::new_all();
    for _process in s.processes_by_exact_name(service_name.as_str()) {
        return Some(_process.pid());
    }
    return None;
}

pub enum ServiceName {
    VitalService,
    VitalRustService,
}

impl ServiceName {
    pub fn as_str(&self) -> &'static str {
        match self {
            ServiceName::VitalService => "VitalService",
            ServiceName::VitalRustService => "VitalRustService",
        }
    }
}
