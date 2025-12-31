//! System data endpoints.

use chrono::{DateTime, Utc};
use rocket::serde::json::Json;
use rocket::{get, post, State};
use std::sync::Arc;

use super::LocalOnly;
use crate::models::{
    GetMachineDynamicDataResponse, GetMachineStaticDataResponse, GetMachineTimeSeriesRequest,
    TimeSeriesMachineMetricsResponse,
};
use crate::stores::MachineDataStore;

/// GET /api/system/static - Get static hardware information
#[get("/static")]
pub fn get_static(
    _local: LocalOnly,
    machine_store: &State<Arc<MachineDataStore>>,
) -> Json<GetMachineStaticDataResponse> {
    Json(machine_store.get_static_data())
}

/// GET /api/system/dynamic - Get current hardware usage data
#[get("/dynamic")]
pub fn get_dynamic(
    _local: LocalOnly,
    machine_store: &State<Arc<MachineDataStore>>,
) -> Json<GetMachineDynamicDataResponse> {
    Json(machine_store.get_dynamic_data())
}

/// POST /api/system/timeseries - Get historical metrics for a time range
#[post("/timeseries", data = "<request>")]
pub async fn get_timeseries(
    _local: LocalOnly,
    request: Json<GetMachineTimeSeriesRequest>,
    machine_store: &State<Arc<MachineDataStore>>,
) -> Json<TimeSeriesMachineMetricsResponse> {
    let earliest = DateTime::parse_from_rfc3339(&request.earliest)
        .map(|dt| dt.with_timezone(&Utc))
        .unwrap_or_else(|_| Utc::now() - chrono::Duration::hours(1));

    let latest = DateTime::parse_from_rfc3339(&request.latest)
        .map(|dt| dt.with_timezone(&Utc))
        .unwrap_or_else(|_| Utc::now());

    let response = machine_store.get_metrics(earliest, latest).await;
    Json(response)
}
