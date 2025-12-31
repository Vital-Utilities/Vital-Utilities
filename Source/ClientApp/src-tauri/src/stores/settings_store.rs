//! Settings store for JSON file-based settings persistence.

use std::path::PathBuf;
use std::sync::RwLock;

use directories::UserDirs;

use crate::models::{LaunchSettings, MetricsSettings, SettingsDto};

pub struct SettingsStore {
    settings: RwLock<SettingsDto>,
    file_path: PathBuf,
}

impl SettingsStore {
    /// Create a new settings store, loading settings from disk or using defaults
    pub fn new() -> Self {
        let file_path = Self::get_settings_path();
        let settings = Self::load_from_file(&file_path).unwrap_or_default();

        Self {
            settings: RwLock::new(settings),
            file_path,
        }
    }

    /// Get the path to the settings file
    fn get_settings_path() -> PathBuf {
        let user_dirs = UserDirs::new().expect("Failed to get user directories");
        let doc_dir = user_dirs
            .document_dir()
            .expect("Failed to get documents directory");
        doc_dir.join("Vital Utilities").join("Settings.json")
    }

    /// Load settings from file
    fn load_from_file(path: &PathBuf) -> Option<SettingsDto> {
        let contents = std::fs::read_to_string(path).ok()?;
        serde_json::from_str(&contents).ok()
    }

    /// Get the current settings
    pub fn get(&self) -> SettingsDto {
        self.settings.read().unwrap().clone()
    }

    /// Get launch settings
    pub fn get_launch_settings(&self) -> LaunchSettings {
        self.settings.read().unwrap().launch.clone()
    }

    /// Get metrics settings
    pub fn get_metrics_settings(&self) -> MetricsSettings {
        self.settings.read().unwrap().metrics.clone()
    }

    /// Update settings and persist to disk
    pub fn update(&self, new_settings: SettingsDto) -> Result<(), String> {
        // Ensure directory exists
        if let Some(parent) = self.file_path.parent() {
            std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }

        // Serialize and write
        let json = serde_json::to_string_pretty(&new_settings).map_err(|e| e.to_string())?;
        std::fs::write(&self.file_path, json).map_err(|e| e.to_string())?;

        // Update in-memory settings
        *self.settings.write().unwrap() = new_settings;

        Ok(())
    }

    /// Update only the run_at_startup setting
    pub fn set_run_at_startup(&self, enabled: bool) -> Result<(), String> {
        let mut settings = self.get();
        settings.run_at_startup = Some(enabled);
        self.update(settings)
    }

    /// Check if metrics persistence is enabled
    pub fn is_metrics_persistence_enabled(&self) -> bool {
        self.settings.read().unwrap().metrics.persist_metrics
    }

    /// Get the HTTP port
    pub fn get_http_port(&self) -> i32 {
        self.settings.read().unwrap().launch.vital_service_http_port
    }

    /// Get the HTTPS port
    pub fn get_https_port(&self) -> i32 {
        self.settings
            .read()
            .unwrap()
            .launch
            .vital_service_https_port
    }
}

impl Default for SettingsStore {
    fn default() -> Self {
        Self::new()
    }
}
