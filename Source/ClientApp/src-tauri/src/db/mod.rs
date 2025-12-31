pub mod app;

pub use app::AppDb;

use directories::UserDirs;
use std::path::PathBuf;

/// Get the path to the Vital Utilities data directory
pub fn get_data_dir() -> PathBuf {
    let user_dirs = UserDirs::new().expect("Failed to get user directories");
    let doc_dir = user_dirs.document_dir().expect("Failed to get documents directory");
    doc_dir.join("Vital Utilities")
}

/// Get the path to the app database
pub fn get_app_db_path() -> PathBuf {
    get_data_dir().join("app.db")
}
