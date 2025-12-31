//! Process management endpoints.

use rocket::serde::json::Json;
use rocket::{get, post, State};
use std::sync::Arc;

use super::LocalOnly;
use crate::db::AppDb;
use crate::models::{
    GetAllResponse, GetManagedResponse, GetProcessesToAddResponse, GetRunningProcessesResponse,
};
use crate::platform::ProcessManager;
use crate::stores::MachineDataStore;

/// GET /api/process - Get all managed processes and available processes
#[get("/")]
pub async fn get_all(
    _local: LocalOnly,
    db: &State<Arc<AppDb>>,
    machine_store: &State<Arc<MachineDataStore>>,
    process_manager: &State<Arc<dyn ProcessManager>>,
) -> Json<GetAllResponse> {
    let managed_models = db.get_all_managed().await.unwrap_or_default();
    let processes = process_manager.get_available_processes().await;

    Json(GetAllResponse {
        managed_models,
        processes_to_add: processes,
    })
}

/// GET /api/process/managed - Get managed process configurations
#[get("/managed")]
pub async fn get_managed(_local: LocalOnly, db: &State<Arc<AppDb>>) -> Json<GetManagedResponse> {
    let affinity_models = db.get_all_managed().await.unwrap_or_default();
    Json(GetManagedResponse { affinity_models })
}

/// GET /api/process/running - Get currently running processes
#[get("/running")]
pub async fn get_running(
    _local: LocalOnly,
    machine_store: &State<Arc<MachineDataStore>>,
) -> Json<GetRunningProcessesResponse> {
    let process_view = machine_store.get_running_processes();
    Json(GetRunningProcessesResponse { process_view })
}

/// GET /api/process/available - Get processes available to manage
#[get("/available")]
pub async fn get_available(
    _local: LocalOnly,
    process_manager: &State<Arc<dyn ProcessManager>>,
) -> Json<GetProcessesToAddResponse> {
    let processes = process_manager.get_available_processes().await;
    Json(GetProcessesToAddResponse { processes })
}

/// POST /api/process/kill/<id> - Kill a process by PID
#[post("/kill/<id>")]
pub async fn kill(
    _local: LocalOnly,
    id: u32,
    process_manager: &State<Arc<dyn ProcessManager>>,
) -> Result<(), rocket::http::Status> {
    process_manager
        .kill_process(id)
        .await
        .map_err(|_| rocket::http::Status::InternalServerError)
}

/// POST /api/process/openpath/<id> - Open the file location of a process
#[post("/openpath/<id>")]
pub async fn open_path(
    _local: LocalOnly,
    id: u32,
    process_manager: &State<Arc<dyn ProcessManager>>,
) -> Result<(), rocket::http::Status> {
    process_manager
        .open_process_location(id)
        .await
        .map_err(|_| rocket::http::Status::InternalServerError)
}
