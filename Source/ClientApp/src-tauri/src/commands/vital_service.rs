#[cfg(target_os = "macos")]
use log::{debug, error, info};
#[cfg(target_os = "windows")]
use std::{convert::TryInto, os::windows::process::CommandExt, process::Command, sync::Mutex};

use super::commands::ServiceName;
use log::{debug, error, info};

#[cfg(target_os = "windows")]
pub fn start_vital_service(service_name: ServiceName) -> Result<String, String> {
    if !cfg!(feature = "release") {
        info!("Debug mode: backend will not be started");
        return Ok("Debug mode: backend will not be started".to_string());
    }

    info!("Starting {}", service_name.as_str());
    let result;
    const CREATE_NO_WINDOW: u32 = 0x08000000;
    match service_name {
        ServiceName::VitalService => {
            result = Command::new("cmd")
                .args(&["/C", "start", "./bin/VitalService/VitalService.exe"])
                .creation_flags(CREATE_NO_WINDOW)
                .spawn();
        }
        ServiceName::VitalRustService => {
            result = Command::new("cmd")
                .args(&["/C", "start", "./bin/VitalRustService/VitalRustService.exe"])
                .creation_flags(CREATE_NO_WINDOW)
                .spawn();
        }
    }

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

#[cfg(target_os = "macos")]
pub fn start_vital_service(service_name: ServiceName) -> Result<String, String> {
    Ok(String::new())
}
