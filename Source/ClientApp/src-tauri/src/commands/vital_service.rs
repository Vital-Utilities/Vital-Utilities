//! This module is kept for backwards compatibility but the functionality has been moved.
//! The backend service is now embedded directly in the Tauri application and started
//! automatically via the backend module.
//!
//! Previously this module contained code to spawn VitalRustService as a separate process.
//! Now the service runs in-process as part of the Tauri app.

use log::info;

/// Legacy function - backend is now embedded and starts automatically
pub fn start_embedded_backend_notice() {
    info!("Backend service is now embedded in the Tauri app and starts automatically on app launch.");
}
