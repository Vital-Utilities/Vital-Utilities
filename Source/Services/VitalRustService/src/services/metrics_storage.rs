//! Background service for storing metrics to database.

use chrono::{Duration, Utc};
use std::sync::Arc;
use tokio::time::{interval, Duration as TokioDuration};

use crate::db::MetricsDb;
use crate::stores::{MachineDataStore, SettingsStore};

pub struct MetricsStorageService {
    metrics_db: Arc<MetricsDb>,
    machine_store: Arc<MachineDataStore>,
    settings_store: Arc<SettingsStore>,
}

impl MetricsStorageService {
    pub fn new(
        metrics_db: Arc<MetricsDb>,
        machine_store: Arc<MachineDataStore>,
        settings_store: Arc<SettingsStore>,
    ) -> Self {
        Self {
            metrics_db,
            machine_store,
            settings_store,
        }
    }

    /// Run the metrics storage service
    /// - Saves metrics to database every 2 seconds
    /// - Trims old data every 30 minutes
    pub async fn run(&self) {
        let mut save_interval = interval(TokioDuration::from_secs(2));
        let mut trim_interval = interval(TokioDuration::from_secs(1800)); // 30 minutes

        loop {
            tokio::select! {
                _ = save_interval.tick() => {
                    self.save_metrics().await;
                }
                _ = trim_interval.tick() => {
                    self.trim_old_data().await;
                }
            }
        }
    }

    /// Save current metrics snapshot to cache and optionally to database
    async fn save_metrics(&self) {
        // Create snapshot from current machine data
        let snapshot = self.machine_store.create_current_snapshot();

        // Add to in-memory cache
        self.machine_store.add_to_cache(snapshot.clone());

        // Persist to database if enabled
        if self.settings_store.is_metrics_persistence_enabled() {
            if let Err(e) = self.metrics_db.insert_metrics(&snapshot).await {
                log::error!("Failed to save metrics to database: {:?}", e);
            }
        }
    }

    /// Trim data older than 2 days from cache and database
    async fn trim_old_data(&self) {
        let cutoff = Utc::now() - Duration::days(2);

        // Trim in-memory cache
        self.machine_store.trim_cache(Duration::days(2));

        // Trim database
        if self.settings_store.is_metrics_persistence_enabled() {
            match self.metrics_db.delete_metrics_before(cutoff).await {
                Ok(count) => {
                    if count > 0 {
                        log::info!("Trimmed {} old metrics records from database", count);
                    }
                }
                Err(e) => {
                    log::error!("Failed to trim old metrics: {:?}", e);
                }
            }
        }
    }
}
