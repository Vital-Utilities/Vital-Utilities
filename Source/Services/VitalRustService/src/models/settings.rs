//! Settings models matching the .NET SettingsDto structure.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SettingsDto {
    #[serde(rename = "runAtStarup")] // Match .NET typo for compatibility
    pub run_at_startup: Option<bool>,
    pub launch: LaunchSettings,
    pub metrics: MetricsSettings,
}

impl Default for SettingsDto {
    fn default() -> Self {
        Self {
            run_at_startup: Some(false),
            launch: LaunchSettings::default(),
            metrics: MetricsSettings::default(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LaunchSettings {
    pub vital_service_https_port: i32,
    pub vital_service_http_port: i32,
}

impl Default for LaunchSettings {
    fn default() -> Self {
        Self {
            vital_service_https_port: 50031,
            vital_service_http_port: 50030,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MetricsSettings {
    pub persist_metrics: bool,
}

impl Default for MetricsSettings {
    fn default() -> Self {
        Self {
            persist_metrics: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClientSettings {
    pub always_on_top: bool,
}

impl Default for ClientSettings {
    fn default() -> Self {
        Self {
            always_on_top: false,
        }
    }
}
