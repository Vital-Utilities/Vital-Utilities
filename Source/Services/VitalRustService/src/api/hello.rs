//! Health check endpoint.

use rocket::get;

use super::LocalOnly;

/// GET /api/hello - Health check endpoint
#[get("/")]
pub fn index(_local: LocalOnly) -> &'static str {
    "Hello from VitalRustService!"
}
