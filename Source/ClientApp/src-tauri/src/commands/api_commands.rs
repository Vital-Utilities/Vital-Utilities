//! Tauri commands for API endpoints - replaces Rocket HTTP endpoints
//! These commands are called from the frontend using invoke()

use std::sync::Arc;
use tauri::State;

use crate::db::AppDb;
use crate::models::{
    AddProcessRequest, GetAllResponse, GetMachineTimeSeriesRequest, GetManagedResponse,
    GetProcessesToAddResponse, GetRunningProcessesResponse, ManagedModelDto, ProfileDto,
    SettingsDto, UpdateManagedRequest, UpdateProfileRequest,
};
use crate::platform::{ProcessManager, StartupManager};
use crate::stores::{MachineDataStore, SettingsStore};

// ============================================================================
// System Commands
// ============================================================================

#[tauri::command]
pub fn get_system_static(
    machine_store: State<Arc<MachineDataStore>>,
) -> Result<crate::models::GetMachineStaticDataResponse, String> {
    Ok(machine_store.get_static_data())
}

#[tauri::command]
pub fn get_system_dynamic(
    machine_store: State<Arc<MachineDataStore>>,
) -> Result<crate::models::GetMachineDynamicDataResponse, String> {
    Ok(machine_store.get_dynamic_data())
}

#[tauri::command]
pub async fn get_system_timeseries(
    request: GetMachineTimeSeriesRequest,
    machine_store: State<'_, Arc<MachineDataStore>>,
) -> Result<crate::models::TimeSeriesMachineMetricsResponse, String> {
    // Parse datetime strings to DateTime<Utc>
    let earliest = chrono::DateTime::parse_from_rfc3339(&request.earliest)
        .map_err(|e| format!("Invalid earliest datetime: {}", e))?
        .with_timezone(&chrono::Utc);
    let latest = chrono::DateTime::parse_from_rfc3339(&request.latest)
        .map_err(|e| format!("Invalid latest datetime: {}", e))?
        .with_timezone(&chrono::Utc);

    Ok(machine_store.get_metrics(earliest, latest).await)
}

// ============================================================================
// Process Commands
// ============================================================================

#[tauri::command]
pub async fn get_processes(
    db: State<'_, Arc<AppDb>>,
    process_manager: State<'_, Arc<dyn ProcessManager>>,
) -> Result<GetAllResponse, String> {
    let managed_models = db.get_all_managed().await.unwrap_or_default();
    let processes = process_manager.get_available_processes().await;

    Ok(GetAllResponse {
        managed_models,
        processes_to_add: processes,
    })
}

#[tauri::command]
pub async fn get_managed_processes(
    db: State<'_, Arc<AppDb>>,
) -> Result<GetManagedResponse, String> {
    let affinity_models = db.get_all_managed().await.unwrap_or_default();
    Ok(GetManagedResponse { affinity_models })
}

#[tauri::command]
pub fn get_running_processes(
    machine_store: State<Arc<MachineDataStore>>,
) -> Result<GetRunningProcessesResponse, String> {
    let process_view = machine_store.get_running_processes();
    Ok(GetRunningProcessesResponse { process_view })
}

#[tauri::command]
pub async fn get_processes_to_add(
    process_manager: State<'_, Arc<dyn ProcessManager>>,
) -> Result<GetProcessesToAddResponse, String> {
    let processes = process_manager.get_available_processes().await;
    Ok(GetProcessesToAddResponse { processes })
}

#[tauri::command]
pub async fn kill_process(
    id: u32,
    process_manager: State<'_, Arc<dyn ProcessManager>>,
) -> Result<(), String> {
    process_manager.kill_process(id).await
}

#[tauri::command]
pub async fn open_process_path(
    id: u32,
    process_manager: State<'_, Arc<dyn ProcessManager>>,
) -> Result<(), String> {
    process_manager.open_process_location(id).await
}

// ============================================================================
// Profile Commands
// ============================================================================

#[tauri::command]
pub async fn get_all_profiles(db: State<'_, Arc<AppDb>>) -> Result<Vec<ProfileDto>, String> {
    db.get_all_profiles().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_profile(id: i64, db: State<'_, Arc<AppDb>>) -> Result<ProfileDto, String> {
    db.get_profile(id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_profile(
    name: String,
    db: State<'_, Arc<AppDb>>,
) -> Result<ProfileDto, String> {
    db.create_profile(&name).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_profile(
    request: UpdateProfileRequest,
    db: State<'_, Arc<AppDb>>,
) -> Result<(), String> {
    db.update_profile(&request.profile)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_profile(id: i64, db: State<'_, Arc<AppDb>>) -> Result<(), String> {
    db.delete_profile(id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn add_process_config(
    request: AddProcessRequest,
    db: State<'_, Arc<AppDb>>,
) -> Result<ManagedModelDto, String> {
    db.add_managed(
        request.profile_id,
        &request.process_name,
        &request.execution_path,
        &request.alias,
        request.process_priority,
        &request.affinity,
    )
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_process_config(
    request: UpdateManagedRequest,
    db: State<'_, Arc<AppDb>>,
) -> Result<(), String> {
    db.update_managed(&request.managed_model_dto)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_process_config(id: i64, db: State<'_, Arc<AppDb>>) -> Result<(), String> {
    db.delete_managed(id).await.map_err(|e| e.to_string())
}

// ============================================================================
// Settings Commands
// ============================================================================

#[tauri::command]
pub fn get_settings(store: State<Arc<SettingsStore>>) -> Result<SettingsDto, String> {
    Ok(store.get())
}

#[tauri::command]
pub fn update_settings(
    settings: SettingsDto,
    store: State<Arc<SettingsStore>>,
) -> Result<(), String> {
    store.update(settings).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn set_run_at_startup(
    enabled: bool,
    store: State<'_, Arc<SettingsStore>>,
    startup_manager: State<'_, Arc<dyn StartupManager>>,
) -> Result<(), String> {
    store
        .set_run_at_startup(enabled)
        .map_err(|e| e.to_string())?;
    startup_manager.set_run_at_startup(enabled).await
}

// ============================================================================
// Hello/Health Check
// ============================================================================

#[tauri::command]
pub fn api_hello() -> Result<String, String> {
    Ok("Hello from VitalRustService!".to_string())
}
