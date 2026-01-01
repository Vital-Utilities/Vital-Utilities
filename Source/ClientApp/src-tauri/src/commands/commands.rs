use std::{io::Error, path::PathBuf};

use crate::APP_HANDLE;
use log::{debug, error, info};
use sysinfo::{Pid, System};
use tauri::{AppHandle, Manager};
use vital_service_api::models::{ClientSettings, LaunchSettings, SettingsDto};

/// Get the document directory using the dirs crate (cross-platform)
fn document_dir() -> Option<PathBuf> {
    dirs::document_dir()
}

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

        // Ensure the parent directory exists
        if let Some(parent) = file_path.parent() {
            let _ = std::fs::create_dir_all(parent);
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
                let msg = "Failed to get app handle, app must restart to apply new settings";
                error!("{}", msg);
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

/// Creates default settings
fn create_default_settings() -> SettingsDto {
    SettingsDto {
        run_at_starup: Some(false),
        launch: Box::new(LaunchSettings {
            vital_service_https_port: 50031,
            vital_service_http_port: 50030,
        }),
        metrics: Box::new(vital_service_api::models::MetricsSettings {
            persist_metrics: true,
        }),
    }
}

/// Writes settings to the given file path
fn write_settings_file(file_path: &std::path::Path, settings: &SettingsDto) -> Result<(), String> {
    // Ensure the parent directory exists
    if let Some(parent) = file_path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| format!("Failed to create directory: {}", e))?;
    }

    let content = serde_json::to_string_pretty(settings)
        .map_err(|e| format!("Failed to serialize settings: {}", e))?;

    std::fs::write(file_path, content)
        .map_err(|e| format!("Failed to write settings file: {}", e))?;

    info!("Settings file written to {}", file_path.display());
    Ok(())
}

/// Gets the settings file path
fn get_settings_file_path() -> Result<std::path::PathBuf, String> {
    let document_dir = document_dir()
        .ok_or_else(|| "Failed to get document directory".to_string())?;

    Ok(document_dir
        .join("Vital Utilities")
        .join("Settings.json"))
}

pub fn get_backend_settings() -> Result<SettingsDto, String> {
    let file_path = get_settings_file_path()?;

    // Try to read the settings file
    let settings_content = match std::fs::read_to_string(&file_path) {
        Ok(content) => content,
        Err(_) => {
            // File doesn't exist, create with defaults
            info!("Settings file not found, creating with defaults");
            let settings = create_default_settings();
            let _ = write_settings_file(&file_path, &settings);
            return Ok(settings);
        }
    };

    // Try to parse the settings
    match serde_json::from_str::<SettingsDto>(&settings_content) {
        Ok(settings) => Ok(settings),
        Err(e) => {
            // Settings file is corrupted - backup and reset
            error!("Settings file is corrupted: {}. Backing up and resetting to defaults.", e);

            // Create backup with timestamp
            let backup_path = file_path.with_extension("json.backup");
            if let Err(backup_err) = std::fs::rename(&file_path, &backup_path) {
                error!("Failed to backup corrupted settings: {}", backup_err);
            } else {
                info!("Corrupted settings backed up to {}", backup_path.display());
            }

            // Create new default settings
            let settings = create_default_settings();
            let _ = write_settings_file(&file_path, &settings);
            Ok(settings)
        }
    }
}

/// Reset settings to defaults. Backs up current settings file first.
#[tauri::command]
pub fn reset_settings_to_defaults() -> Result<String, String> {
    let file_path = get_settings_file_path()?;

    // Backup existing file if it exists
    if file_path.exists() {
        let timestamp = chrono::Utc::now().format("%Y%m%d_%H%M%S");
        let backup_name = format!("Settings.{}.backup.json", timestamp);
        let backup_path = file_path.parent()
            .ok_or("Invalid settings path")?
            .join(backup_name);

        if let Err(e) = std::fs::rename(&file_path, &backup_path) {
            error!("Failed to backup settings: {}", e);
        } else {
            info!("Settings backed up to {}", backup_path.display());
        }
    }

    // Create new default settings
    let settings = create_default_settings();
    write_settings_file(&file_path, &settings)?;

    Ok("Settings reset to defaults successfully".to_string())
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
    // In Tauri v2, get_window is renamed to get_webview_window
    let window = app.get_webview_window("main").unwrap();
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
