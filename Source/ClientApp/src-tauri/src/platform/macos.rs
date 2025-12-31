//! macOS-specific implementations for process and startup management.

#![cfg(target_os = "macos")]

use async_trait::async_trait;
use std::process::Command;

use super::{ProcessManager, StartupManager};
use crate::models::{ProcessPriorityEnum, ProcessToAddDto};

pub struct MacOSProcessManager;

impl MacOSProcessManager {
    pub fn new() -> Self {
        Self
    }
}

#[async_trait]
impl ProcessManager for MacOSProcessManager {
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
                    Command::new("open")
                        .arg(parent)
                        .spawn()
                        .map_err(|e| format!("Failed to open Finder: {}", e))?;
                    return Ok(());
                }
            }
        }

        Err("Could not find process or its path".to_string())
    }

    async fn set_process_affinity(&self, _pid: u32, _affinity_binary: &str) -> Result<(), String> {
        // macOS doesn't support process affinity the same way Windows does
        Err("Process affinity is not supported on macOS".to_string())
    }

    async fn set_process_priority(
        &self,
        pid: u32,
        priority: ProcessPriorityEnum,
    ) -> Result<(), String> {
        if matches!(priority, ProcessPriorityEnum::DontOverride) {
            return Ok(());
        }

        // macOS uses nice values from -20 (highest) to 19 (lowest)
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
        // On macOS, we generally can't modify system processes without root
        // For simplicity, return true and let the actual operation fail if needed
        true
    }
}

pub struct MacOSStartupManager;

impl MacOSStartupManager {
    pub fn new() -> Self {
        Self
    }
}

#[async_trait]
impl StartupManager for MacOSStartupManager {
    async fn set_run_at_startup(&self, enabled: bool) -> Result<(), String> {
        // Use launchctl to manage launch agents
        let plist_path = dirs::home_dir()
            .ok_or("Could not find home directory")?
            .join("Library/LaunchAgents/com.vital.service.plist");

        if enabled {
            let exe_path = std::env::current_exe()
                .map_err(|e| format!("Failed to get exe path: {}", e))?;

            let plist_content = format!(
                r#"<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.vital.service</string>
    <key>ProgramArguments</key>
    <array>
        <string>{}</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <false/>
</dict>
</plist>"#,
                exe_path.display()
            );

            std::fs::write(&plist_path, plist_content)
                .map_err(|e| format!("Failed to write plist: {}", e))?;

            Command::new("launchctl")
                .args(["load", plist_path.to_str().unwrap()])
                .output()
                .map_err(|e| format!("Failed to load launch agent: {}", e))?;
        } else {
            if plist_path.exists() {
                let _ = Command::new("launchctl")
                    .args(["unload", plist_path.to_str().unwrap()])
                    .output();
                std::fs::remove_file(&plist_path)
                    .map_err(|e| format!("Failed to remove plist: {}", e))?;
            }
        }

        Ok(())
    }

    async fn is_run_at_startup_enabled(&self) -> bool {
        dirs::home_dir()
            .map(|h| h.join("Library/LaunchAgents/com.vital.service.plist").exists())
            .unwrap_or(false)
    }
}
