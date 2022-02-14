pub fn get_client_settings() -> Result<ClientSettings, String> {
    let document_dir = document_dir();
    if document_dir.is_none() {
        let msg = "failed to get document dir".to_string();
        error!("{}", msg);
        return Err(msg);
    }
    let file_path = &document_dir
        .unwrap()
        .join(r#"Vital Utilities\ClientSettings.json"#);

    let settings_file = std::fs::read_to_string(file_path);
    if settings_file.is_err() {
        error!("Failed to read ClientSettings file, Creating new ClientSettings File");
        let settings = backend_types::ClientSettings {
            always_on_top: true,
        };
        let content = serde_json::to_string(&settings);
        if content.is_err() {
            error!("failed to serialize new ClientSettings");
            return Err("failed to serialize new ClientSettings".to_string());
        }
        match std::fs::write(file_path, content.unwrap()) {
            Ok(_) => {
                info!("Created new ClientSettings file");
                return Ok(settings);
            }
            Err(e) => {
                error!("Failed to write client settings: {}", e);
                return Err(format!("{}", e));
            }
        }
    }

    let settings = serde_json::from_str::<backend_types::ClientSettings>(&settings_file.unwrap());
    match settings {
        Ok(settings) => {
            debug!("Successfully read client settings");
            return Ok(settings);
        }
        Err(e) => {
            error!("{}", e);
            return Err(format!("{}", e));
        }
    }
}
