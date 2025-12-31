//! Time-series metrics models for database storage.
//!
//! These match the .NET TimeSeriesMachineMetricsModel structure.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use super::dto::DateRange;

/// Time series machine metrics model for storage
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimeSeriesMachineMetricsModel {
    pub id: i64,
    pub date_time_offset: DateTime<Utc>,
    pub cpu_usage_data: Option<Vec<CpuUsageMetricModel>>,
    pub gpu_usage_data: Option<Vec<GpuUsageMetricModel>>,
    pub ram_usage_data: Option<RamUsageMetricModel>,
    pub network_usage_data: Option<Vec<NetworkUsageMetricModel>>,
    pub disk_usage_data: Option<Vec<DiskUsageMetricModel>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CpuUsageMetricModel {
    pub id: Option<i64>,
    pub unique_identifier: Option<String>,
    pub total_core_usage_percentage: Option<f32>,
    pub package_temperature: Option<f32>,
    pub power_draw_wattage: Option<f32>,
    pub core_clocks_mhz: Option<HashMap<i32, f32>>,
    pub cores_usage_percentage: Option<HashMap<i32, f32>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RamUsageMetricModel {
    pub id: Option<i64>,
    pub unique_identifier: Option<String>,
    pub used_memory_bytes: Option<f64>,
    pub total_visible_memory_bytes: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GpuUsageMetricModel {
    pub id: Option<i64>,
    pub unique_identifier: Option<String>,
    pub core_usage_percentage: Option<f32>,
    pub vram_usage_bytes: Option<f32>,
    pub vram_total_bytes: Option<f32>,
    pub core_temperature: Option<f32>,
    pub power_draw_wattage: Option<f32>,
    pub fan_percentage: Option<HashMap<String, f32>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiskUsageMetricModel {
    pub id: Option<i64>,
    pub unique_identifier: Option<String>,
    pub serial: Option<String>,
    pub name: Option<String>,
    pub drive_letter: Option<String>,
    pub used_space_percentage: Option<f32>,
    pub used_space_bytes: Option<i64>,
    pub total_space_bytes: Option<i64>,
    pub write_activity_percentage: Option<f32>,
    pub total_activity_percentage: Option<f32>,
    pub read_rate_bytes_per_second: Option<f64>,
    pub write_rate_bytes_per_second: Option<f64>,
    pub data_read_bytes: Option<f64>,
    pub data_written_bytes: Option<f64>,
    pub temperatures: Option<HashMap<String, f32>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NetworkUsageMetricModel {
    pub id: Option<i64>,
    pub unique_identifier: Option<String>,
    pub upload_speed_bps: Option<i64>,
    pub download_speed_bps: Option<i64>,
}

/// Response for time series metrics query
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimeSeriesMachineMetricsResponse {
    pub request_range: DateRange,
    pub metrics: Vec<TimeSeriesMachineMetricsModel>,
}
