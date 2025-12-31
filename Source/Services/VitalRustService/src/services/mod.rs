#[cfg(target_os = "windows")]
pub mod config_applyer;
pub mod metrics_storage;

#[cfg(target_os = "windows")]
pub use config_applyer::ConfigApplyerService;
pub use metrics_storage::MetricsStorageService;
