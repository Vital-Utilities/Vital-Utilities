use directories::UserDirs;
use log::{error, info};
use vital_service_api::models::{LaunchSettings, SettingsDto};

pub fn get_backend_settings() -> Result<SettingsDto, String> {
    let user_dirs = UserDirs::new().unwrap();
    let document_dir = user_dirs.document_dir();
    if document_dir.is_none() {
        let msg = "failed to get document dir".to_string();
        error!("{}", msg);
        return Err(msg);
    }
    let file_path = document_dir
        .unwrap()
        .join(r#"Vital Utilities"#)
        .join(r#"Settings.json"#);
    
    let settings_file = std::fs::read_to_string(file_path);
    if settings_file.is_err() {
        let msg = "failed to read settings file".to_string();
        error!("{}", msg);
        return Err(msg);
    }

    let settings = serde_json::from_str::<SettingsDto>(&settings_file.unwrap());
    match settings {
        Ok(settings) => Ok(settings),
        Err(e) => {
            error!("{}", e);
            Err(format!("{}", e))
        }
    }
}

pub fn get_vital_service_ports() -> Result<LaunchSettings, String> {
    let settings_file = get_backend_settings();
    match settings_file {
        Ok(settings) => Ok(*settings.launch),
        Err(e) => {
            error!("{}", e);
            Err(e)
        }
    }
}
