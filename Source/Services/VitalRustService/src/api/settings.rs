//! Settings management endpoints.

use rocket::serde::json::Json;
use rocket::{get, put, State};
use std::sync::Arc;

use super::LocalOnly;
use crate::models::SettingsDto;
use crate::platform::StartupManager;
use crate::stores::SettingsStore;

/// GET /api/settings - Get current settings
#[get("/")]
pub fn get_settings(_local: LocalOnly, store: &State<Arc<SettingsStore>>) -> Json<SettingsDto> {
    Json(store.get())
}

/// PUT /api/settings - Update settings
#[put("/", data = "<settings>")]
pub fn update_settings(
    _local: LocalOnly,
    settings: Json<SettingsDto>,
    store: &State<Arc<SettingsStore>>,
) -> Result<(), rocket::http::Status> {
    store
        .update(settings.into_inner())
        .map_err(|_| rocket::http::Status::InternalServerError)
}

/// PUT /api/settings/startup?<enabled> - Set run at startup
#[put("/startup?<enabled>")]
pub async fn set_run_at_startup(
    _local: LocalOnly,
    enabled: bool,
    store: &State<Arc<SettingsStore>>,
    startup_manager: &State<Arc<dyn StartupManager>>,
) -> Result<(), rocket::http::Status> {
    // Update settings file
    store
        .set_run_at_startup(enabled)
        .map_err(|_| rocket::http::Status::InternalServerError)?;

    // Configure system startup
    startup_manager
        .set_run_at_startup(enabled)
        .await
        .map_err(|_| rocket::http::Status::InternalServerError)?;

    Ok(())
}
