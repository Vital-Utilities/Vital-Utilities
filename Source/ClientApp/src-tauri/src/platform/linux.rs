//! Linux-specific implementations for process and startup management.

#![cfg(target_os = "linux")]

use async_trait::async_trait;
use std::process::Command;

use super::{ProcessManager, StartupManager};
use crate::models::{ProcessPriorityEnum, ProcessToAddDto};

pub struct LinuxProcessManager;

impl LinuxProcessManager {
    pub fn new() -> Self {
        Self
    }
}

#[async_trait]
impl ProcessManager for LinuxProcessManager {
    async fn get_available_processes(&self) -> Vec<ProcessToAddDto> {
        // Handled by the existing software.rs collector
        vec![]
    }

    async fn kill_process(&self, pid: u32) -> Result<(), String> {
        let output = Command::new("kill")
            .args(["-9", &pid.to_string()])
            .output()
            .map_err(|e| format!("Failed to execute kill: {}", e))?;

        if output.status.success() {
            Ok(())
        } else {
            Err(String::from_utf8_lossy(&output.stderr).to_string())
        }
    }

    async fn open_process_location(&self, pid: u32) -> Result<(), String> {
        use sysinfo::{Pid, System};

        let mut sys = System::new();
        sys.refresh_processes();

        if let Some(process) = sys.process(Pid::from_u32(pid)) {
            if let Some(path) = process.exe() {
                if let Some(parent) = path.parent() {
                    // Try common Linux file managers
                    let file_managers = ["xdg-open", "nautilus", "dolphin", "thunar", "nemo"];

                    for fm in file_managers {
                        if Command::new(fm)
                            .arg(parent)
                            .spawn()
                            .is_ok()
                        {
                            return Ok(());
                        }
                    }

                    return Err("No file manager found".to_string());
                }
            }
        }

        Err("Could not find process or its path".to_string())
    }

    async fn set_process_affinity(&self, pid: u32, affinity_binary: &str) -> Result<(), String> {
        // Convert binary string to CPU list for taskset
        let mut cpus = Vec::new();
        for (i, c) in affinity_binary.chars().rev().enumerate() {
            if c == '1' {
                cpus.push(i.to_string());
            }
        }

        if cpus.is_empty() {
            return Err("No CPUs specified in affinity mask".to_string());
        }

        let cpu_list = cpus.join(",");
        let output = Command::new("taskset")
            .args(["-cp", &cpu_list, &pid.to_string()])
            .output()
            .map_err(|e| format!("Failed to execute taskset: {}", e))?;

        if output.status.success() {
            Ok(())
        } else {
            Err(String::from_utf8_lossy(&output.stderr).to_string())
        }
    }

    async fn set_process_priority(
        &self,
        pid: u32,
        priority: ProcessPriorityEnum,
    ) -> Result<(), String> {
        if matches!(priority, ProcessPriorityEnum::DontOverride) {
            return Ok(());
        }

        // Linux uses nice values from -20 (highest) to 19 (lowest)
        let nice_value = match priority {
            ProcessPriorityEnum::RealTime => -20,
            ProcessPriorityEnum::High => -10,
            ProcessPriorityEnum::AboveNormal => -5,
            ProcessPriorityEnum::Normal => 0,
            ProcessPriorityEnum::BelowNormal => 5,
            ProcessPriorityEnum::Idle => 19,
            ProcessPriorityEnum::DontOverride => return Ok(()),
        };

        let output = Command::new("renice")
            .args([&nice_value.to_string(), "-p", &pid.to_string()])
            .output()
            .map_err(|e| format!("Failed to execute renice: {}", e))?;

        if output.status.success() {
            Ok(())
        } else {
            Err(String::from_utf8_lossy(&output.stderr).to_string())
        }
    }

    fn can_modify_process(&self, _pid: u32) -> bool {
        // On Linux, permissions depend on user and process ownership
        // Return true and let the actual operation fail if needed
        true
    }
}

pub struct LinuxStartupManager;

impl LinuxStartupManager {
    pub fn new() -> Self {
        Self
    }
}

#[async_trait]
impl StartupManager for LinuxStartupManager {
    async fn set_run_at_startup(&self, enabled: bool) -> Result<(), String> {
        // Use systemd user service for autostart
        let service_path = dirs::config_dir()
            .ok_or("Could not find config directory")?
            .join("systemd/user/vital-service.service");

        if enabled {
            let exe_path = std::env::current_exe()
                .map_err(|e| format!("Failed to get exe path: {}", e))?;

            // Create parent directory if needed
            if let Some(parent) = service_path.parent() {
                std::fs::create_dir_all(parent)
                    .map_err(|e| format!("Failed to create directory: {}", e))?;
            }

            let service_content = format!(
                r#"[Unit]
Description=Vital Service
After=graphical-session.target

[Service]
Type=simple
ExecStart={}
Restart=on-failure

[Install]
WantedBy=default.target"#,
                exe_path.display()
            );

            std::fs::write(&service_path, service_content)
                .map_err(|e| format!("Failed to write service file: {}", e))?;

            Command::new("systemctl")
                .args(["--user", "daemon-reload"])
                .output()
                .map_err(|e| format!("Failed to reload systemd: {}", e))?;

            Command::new("systemctl")
                .args(["--user", "enable", "vital-service"])
                .output()
                .map_err(|e| format!("Failed to enable service: {}", e))?;
        } else {
            let _ = Command::new("systemctl")
                .args(["--user", "disable", "vital-service"])
                .output();

            if service_path.exists() {
                std::fs::remove_file(&service_path)
                    .map_err(|e| format!("Failed to remove service file: {}", e))?;
            }

            let _ = Command::new("systemctl")
                .args(["--user", "daemon-reload"])
                .output();
        }

        Ok(())
    }

    async fn is_run_at_startup_enabled(&self) -> bool {
        let output = Command::new("systemctl")
            .args(["--user", "is-enabled", "vital-service"])
            .output();

        match output {
            Ok(output) => {
                String::from_utf8_lossy(&output.stdout)
                    .trim()
                    .eq_ignore_ascii_case("enabled")
            }
            Err(_) => false,
        }
    }
}
