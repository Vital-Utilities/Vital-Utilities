//! Windows-specific implementations for process and startup management.

#![cfg(target_os = "windows")]

use async_trait::async_trait;
use std::process::Command;

use super::{ProcessManager, StartupManager};
use crate::models::{ProcessPriorityEnum, ProcessToAddDto};

pub struct WindowsProcessManager;

impl WindowsProcessManager {
    pub fn new() -> Self {
        Self
    }
}

#[async_trait]
impl ProcessManager for WindowsProcessManager {
    async fn get_available_processes(&self) -> Vec<ProcessToAddDto> {
        // This is handled by the existing software.rs collector
        // Just return empty here - the actual data comes from the collector
        vec![]
    }

    async fn kill_process(&self, pid: u32) -> Result<(), String> {
        // Use taskkill to kill process tree
        let output = Command::new("taskkill")
            .args(["/F", "/T", "/PID", &pid.to_string()])
            .output()
            .map_err(|e| format!("Failed to execute taskkill: {}", e))?;

        if output.status.success() {
            Ok(())
        } else {
            Err(String::from_utf8_lossy(&output.stderr).to_string())
        }
    }

    async fn open_process_location(&self, pid: u32) -> Result<(), String> {
        // Get process path using Windows API
        use sysinfo::{Pid, System, ProcessesToUpdate};

        let mut sys = System::new();
        // In sysinfo 0.37+, refresh_processes requires arguments
        sys.refresh_processes(ProcessesToUpdate::All, true);

        if let Some(process) = sys.process(Pid::from_u32(pid)) {
            if let Some(path) = process.exe() {
                if let Some(parent) = path.parent() {
                    Command::new("explorer")
                        .arg(parent)
                        .spawn()
                        .map_err(|e| format!("Failed to open explorer: {}", e))?;
                    return Ok(());
                }
            }
        }

        Err("Could not find process or its path".to_string())
    }

    async fn set_process_affinity(&self, pid: u32, affinity_binary: &str) -> Result<(), String> {
        use windows::Win32::Foundation::HANDLE;
        use windows::Win32::System::Threading::{
            OpenProcess, SetProcessAffinityMask, PROCESS_SET_INFORMATION, PROCESS_QUERY_INFORMATION,
        };

        // Convert binary string to usize
        let affinity_mask =
            usize::from_str_radix(affinity_binary, 2).map_err(|e| e.to_string())?;

        unsafe {
            let handle = OpenProcess(
                PROCESS_SET_INFORMATION | PROCESS_QUERY_INFORMATION,
                false,
                pid,
            )
            .map_err(|e| format!("Failed to open process: {}", e))?;

            SetProcessAffinityMask(handle, affinity_mask)
                .map_err(|e| format!("Failed to set affinity: {}", e))?;

            // Close handle
            windows::Win32::Foundation::CloseHandle(handle)
                .map_err(|e| format!("Failed to close handle: {}", e))?;
        }

        Ok(())
    }

    async fn set_process_priority(
        &self,
        pid: u32,
        priority: ProcessPriorityEnum,
    ) -> Result<(), String> {
        use windows::Win32::System::Threading::{
            OpenProcess, SetPriorityClass, ABOVE_NORMAL_PRIORITY_CLASS, BELOW_NORMAL_PRIORITY_CLASS,
            HIGH_PRIORITY_CLASS, IDLE_PRIORITY_CLASS, NORMAL_PRIORITY_CLASS,
            PROCESS_SET_INFORMATION, REALTIME_PRIORITY_CLASS,
        };

        if matches!(priority, ProcessPriorityEnum::DontOverride) {
            return Ok(());
        }

        let priority_class = match priority {
            ProcessPriorityEnum::Idle => IDLE_PRIORITY_CLASS,
            ProcessPriorityEnum::BelowNormal => BELOW_NORMAL_PRIORITY_CLASS,
            ProcessPriorityEnum::Normal => NORMAL_PRIORITY_CLASS,
            ProcessPriorityEnum::AboveNormal => ABOVE_NORMAL_PRIORITY_CLASS,
            ProcessPriorityEnum::High => HIGH_PRIORITY_CLASS,
            ProcessPriorityEnum::RealTime => REALTIME_PRIORITY_CLASS,
            ProcessPriorityEnum::DontOverride => return Ok(()),
        };

        unsafe {
            let handle = OpenProcess(PROCESS_SET_INFORMATION, false, pid)
                .map_err(|e| format!("Failed to open process: {}", e))?;

            SetPriorityClass(handle, priority_class)
                .map_err(|e| format!("Failed to set priority: {}", e))?;

            windows::Win32::Foundation::CloseHandle(handle)
                .map_err(|e| format!("Failed to close handle: {}", e))?;
        }

        Ok(())
    }

    fn can_modify_process(&self, pid: u32) -> bool {
        use windows::Win32::System::Threading::{OpenProcess, PROCESS_SET_INFORMATION};

        unsafe {
            match OpenProcess(PROCESS_SET_INFORMATION, false, pid) {
                Ok(handle) => {
                    let _ = windows::Win32::Foundation::CloseHandle(handle);
                    true
                }
                Err(_) => false,
            }
        }
    }
}

pub struct WindowsStartupManager;

impl WindowsStartupManager {
    pub fn new() -> Self {
        Self
    }
}

#[async_trait]
impl StartupManager for WindowsStartupManager {
    async fn set_run_at_startup(&self, enabled: bool) -> Result<(), String> {
        // Use PowerShell to manage Windows Task Scheduler
        let exe_path = std::env::current_exe()
            .map_err(|e| format!("Failed to get exe path: {}", e))?;

        let script = if enabled {
            format!(
                r#"
                $action = New-ScheduledTaskAction -Execute '{}'
                $trigger = New-ScheduledTaskTrigger -AtLogOn
                $principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -RunLevel Highest
                $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
                Register-ScheduledTask -TaskName 'VitalService' -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force
                "#,
                exe_path.display()
            )
        } else {
            "Unregister-ScheduledTask -TaskName 'VitalService' -Confirm:$false -ErrorAction SilentlyContinue".to_string()
        };

        let output = Command::new("powershell")
            .args(["-Command", &script])
            .output()
            .map_err(|e| format!("Failed to execute PowerShell: {}", e))?;

        if output.status.success() {
            Ok(())
        } else {
            Err(String::from_utf8_lossy(&output.stderr).to_string())
        }
    }

    async fn is_run_at_startup_enabled(&self) -> bool {
        let output = Command::new("powershell")
            .args([
                "-Command",
                "Get-ScheduledTask -TaskName 'VitalService' -ErrorAction SilentlyContinue",
            ])
            .output();

        match output {
            Ok(output) => output.status.success() && !output.stdout.is_empty(),
            Err(_) => false,
        }
    }
}
