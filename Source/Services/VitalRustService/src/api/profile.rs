//! Profile management endpoints.

use rocket::serde::json::Json;
use rocket::{delete, get, put, State};
use std::sync::Arc;

use super::LocalOnly;
use crate::db::AppDb;
use crate::models::{
    AddProcessRequest, CreateProfileRequest, ManagedModelDto, ProfileDto, UpdateManagedRequest,
    UpdateProfileRequest,
};

/// GET /api/profile/all - Get all profiles
#[get("/all")]
pub async fn get_all(_local: LocalOnly, db: &State<Arc<AppDb>>) -> Json<Vec<ProfileDto>> {
    match db.get_all_profiles().await {
        Ok(profiles) => Json(profiles),
        Err(_) => Json(vec![]),
    }
}

/// GET /api/profile/<id> - Get profile by ID
#[get("/<id>")]
pub async fn get_by_id(
    _local: LocalOnly,
    id: i64,
    db: &State<Arc<AppDb>>,
) -> Option<Json<ProfileDto>> {
    db.get_profile(id).await.ok().map(Json)
}

/// PUT /api/profile/create - Create a new profile
#[put("/create", data = "<request>")]
pub async fn create(
    _local: LocalOnly,
    request: Json<CreateProfileRequest>,
    db: &State<Arc<AppDb>>,
) -> Result<Json<ProfileDto>, rocket::http::Status> {
    db.create_profile(&request.name)
        .await
        .map(Json)
        .map_err(|_| rocket::http::Status::InternalServerError)
}

/// PUT /api/profile/update - Update a profile
#[put("/update", data = "<request>")]
pub async fn update(
    _local: LocalOnly,
    request: Json<UpdateProfileRequest>,
    db: &State<Arc<AppDb>>,
) -> Result<(), rocket::http::Status> {
    db.update_profile(&request.profile)
        .await
        .map_err(|_| rocket::http::Status::InternalServerError)
}

/// DELETE /api/profile/<id> - Delete a profile
#[delete("/<id>")]
pub async fn delete_profile(
    _local: LocalOnly,
    id: i64,
    db: &State<Arc<AppDb>>,
) -> Result<(), rocket::http::Status> {
    db.delete_profile(id)
        .await
        .map_err(|_| rocket::http::Status::InternalServerError)
}

/// PUT /api/profile/add-process - Add a managed process to a profile
#[put("/add-process", data = "<request>")]
pub async fn add_process_config(
    _local: LocalOnly,
    request: Json<AddProcessRequest>,
    db: &State<Arc<AppDb>>,
) -> Result<Json<ManagedModelDto>, rocket::http::Status> {
    db.add_managed(
        request.profile_id,
        &request.process_name,
        &request.execution_path,
        &request.alias,
        request.process_priority,
        &request.affinity,
    )
    .await
    .map(Json)
    .map_err(|_| rocket::http::Status::InternalServerError)
}

/// PUT /api/profile/update-process - Update a managed process
#[put("/update-process", data = "<request>")]
pub async fn update_process_config(
    _local: LocalOnly,
    request: Json<UpdateManagedRequest>,
    db: &State<Arc<AppDb>>,
) -> Result<(), rocket::http::Status> {
    db.update_managed(&request.managed_model_dto)
        .await
        .map_err(|_| rocket::http::Status::InternalServerError)
}

/// DELETE /api/profile/delete-process/<id> - Delete a managed process
#[delete("/delete-process/<id>")]
pub async fn delete_process_config(
    _local: LocalOnly,
    id: i64,
    db: &State<Arc<AppDb>>,
) -> Result<(), rocket::http::Status> {
    db.delete_managed(id)
        .await
        .map_err(|_| rocket::http::Status::InternalServerError)
}
