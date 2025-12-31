//! Platform-specific abstractions for cross-platform support.

#[cfg(target_os = "windows")]
pub mod windows;

#[cfg(target_os = "macos")]
pub mod macos;

#[cfg(target_os = "linux")]
pub mod linux;

use async_trait::async_trait;

use crate::models::{ProcessPriorityEnum, ProcessToAddDto};

/// Trait for platform-specific process management
#[async_trait]
pub trait ProcessManager: Send + Sync {
    /// Get list of running processes that can be managed
    async fn get_available_processes(&self) -> Vec<ProcessToAddDto>;

    /// Kill a process by PID
    async fn kill_process(&self, pid: u32) -> Result<(), String>;

    /// Open the file location of a process
    async fn open_process_location(&self, pid: u32) -> Result<(), String>;

    /// Set process affinity (which CPU cores it can run on)
    async fn set_process_affinity(&self, pid: u32, affinity_binary: &str) -> Result<(), String>;

    /// Set process priority
    async fn set_process_priority(
        &self,
        pid: u32,
        priority: ProcessPriorityEnum,
    ) -> Result<(), String>;

    /// Check if we can modify a process (have sufficient permissions)
    fn can_modify_process(&self, pid: u32) -> bool;
}

/// Trait for platform-specific startup management
#[async_trait]
pub trait StartupManager: Send + Sync {
    /// Set whether the service should run at startup
    async fn set_run_at_startup(&self, enabled: bool) -> Result<(), String>;

    /// Check if run at startup is currently enabled
    async fn is_run_at_startup_enabled(&self) -> bool;
}

/// Create the appropriate process manager for the current platform
pub fn create_process_manager() -> Box<dyn ProcessManager> {
    #[cfg(target_os = "windows")]
    {
        Box::new(windows::WindowsProcessManager::new())
    }

    #[cfg(target_os = "macos")]
    {
        Box::new(macos::MacOSProcessManager::new())
    }

    #[cfg(target_os = "linux")]
    {
        Box::new(linux::LinuxProcessManager::new())
    }
}

/// Create the appropriate startup manager for the current platform
pub fn create_startup_manager() -> Box<dyn StartupManager> {
    #[cfg(target_os = "windows")]
    {
        Box::new(windows::WindowsStartupManager::new())
    }

    #[cfg(target_os = "macos")]
    {
        Box::new(macos::MacOSStartupManager::new())
    }

    #[cfg(target_os = "linux")]
    {
        Box::new(linux::LinuxStartupManager::new())
    }
}
