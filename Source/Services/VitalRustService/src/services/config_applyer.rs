//! Background service for applying process affinity/priority configurations.
//!
//! This service runs only on Windows and applies configured profiles to running processes.

use std::sync::Arc;
use sysinfo::{System, Pid};
use tokio::time::{interval, Duration};

use crate::db::AppDb;
use crate::models::ProcessPriorityEnum;
use crate::platform::ProcessManager;

pub struct ConfigApplyerService {
    db: Arc<AppDb>,
    process_manager: Arc<dyn ProcessManager>,
}

impl ConfigApplyerService {
    pub fn new(db: Arc<AppDb>, process_manager: Arc<dyn ProcessManager>) -> Self {
        Self { db, process_manager }
    }

    /// Run the config applyer service
    /// - Polls every 10 seconds
    /// - Applies affinity/priority from enabled profiles to matching processes
    pub async fn run(&self) {
        let mut apply_interval = interval(Duration::from_secs(10));

        loop {
            apply_interval.tick().await;
            self.apply_configs().await;
        }
    }

    /// Apply all enabled profile configurations to running processes
    async fn apply_configs(&self) {
        // Get all enabled profiles with their managed processes
        let profiles = match self.db.get_enabled_profiles().await {
            Ok(p) => p,
            Err(e) => {
                log::error!("Failed to get enabled profiles: {:?}", e);
                return;
            }
        };

        if profiles.is_empty() {
            return;
        }

        // Get current running processes
        let mut sys = System::new();
        sys.refresh_processes();

        // For each enabled profile, apply its configurations
        for (_profile, managed_processes) in profiles {
            for managed in managed_processes {
                // Find matching processes by name
                for (pid, process) in sys.processes() {
                    let process_name = process.name().to_str().unwrap_or_default().to_lowercase();
                    let managed_name = managed.process_name.to_lowercase();

                    // Match by process name (with or without .exe)
                    let name_matches = process_name == managed_name
                        || process_name == format!("{}.exe", managed_name)
                        || process_name.strip_suffix(".exe") == Some(&managed_name);

                    if name_matches {
                        self.apply_to_process(pid.as_u32(), &managed.process_priority, &managed.affinity)
                            .await;
                    }
                }
            }
        }
    }

    /// Apply affinity and priority to a single process
    async fn apply_to_process(
        &self,
        pid: u32,
        priority: &ProcessPriorityEnum,
        affinity: &[i32],
    ) {
        // Apply priority if not DontOverride
        if !matches!(priority, ProcessPriorityEnum::DontOverride) {
            if let Err(e) = self.process_manager.set_process_priority(pid, *priority).await {
                log::debug!("Failed to set priority for PID {}: {}", pid, e);
            }
        }

        // Apply affinity if specified
        if !affinity.is_empty() {
            let affinity_binary = crate::models::affinity_array_to_binary(affinity, 64);
            if let Err(e) = self
                .process_manager
                .set_process_affinity(pid, &affinity_binary)
                .await
            {
                log::debug!("Failed to set affinity for PID {}: {}", pid, e);
            }
        }
    }
}
