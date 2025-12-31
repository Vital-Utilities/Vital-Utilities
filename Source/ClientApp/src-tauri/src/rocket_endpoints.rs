use log::error;
use rocket::{get, serde::json::Json};

use crate::software;

#[get("/idealprocessors?<pid>")]
pub fn ideal_processors(pid: u32) -> Json<Vec<u32>> {
    let result = software::get_process_ideal_processors(pid);
    match result {
        Ok(ideal_processors) => Json(ideal_processors.into_iter().collect()),
        Err(e) => {
            error!("Error getting ideal processors: {:?}", e);
            Json(vec![])
        }
    }
}
