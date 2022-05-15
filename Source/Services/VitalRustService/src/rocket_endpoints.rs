use rocket::{get, serde::json::Json};

use crate::software;

#[get("/idealprocessors?<pid>")]
pub fn ideal_processors(pid: u32) -> Json<Vec<u32>> {
    let result = software::get_process_ideal_processors(pid);

    return Json(result.into_iter().collect());
}
