//! Background service for storing metrics in memory.

use chrono::Duration;
use std::sync::Arc;
use tokio::time::{interval, Duration as TokioDuration};

use crate::stores::{MachineDataStore, SettingsStore};

pub struct MetricsStorageService {
    machine_store: Arc<MachineDataStore>,
    #[allow(dead_code)]
    settings_store: Arc<SettingsStore>,
}

impl MetricsStorageService {
    pub fn new(
        machine_store: Arc<MachineDataStore>,
        settings_store: Arc<SettingsStore>,
    ) -> Self {
        Self {
            machine_store,
            settings_store,
        }
    }

    /// Run the metrics storage service
    /// - Saves metrics to in-memory cache every 2 seconds
    /// - Trims old data every 30 minutes
    pub async fn run(&self) {
        log::info!("MetricsStorageService: STARTING service loop");

        let mut save_interval = interval(TokioDuration::from_secs(2));
        let mut trim_interval = interval(TokioDuration::from_secs(1800)); // 30 minutes

        loop {
            tokio::select! {
                _ = save_interval.tick() => {
                    self.save_metrics();
                }
                _ = trim_interval.tick() => {
                    self.trim_old_data();
                }
            }
        }
    }

    /// Save current metrics snapshot to cache
    fn save_metrics(&self) {
        // Create snapshot from current machine data
        let snapshot = self.machine_store.create_current_snapshot();

        log::info!("MetricsStorageService: saving snapshot, cpu_usage_data present: {:?}",
            snapshot.cpu_usage_data.as_ref().map(|v| v.len()));

        // Add to in-memory cache
        self.machine_store.add_to_cache(snapshot);

        log::info!("MetricsStorageService: cache size after add: {}",
            self.machine_store.metrics_cache.len());
    }

    /// Trim data older than 12 hours from cache
    fn trim_old_data(&self) {
        // Trim in-memory cache (keep last 12 hours)
        self.machine_store.trim_cache(Duration::hours(12));
    }
}
