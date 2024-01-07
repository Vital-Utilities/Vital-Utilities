use log::error;
use std::{mem::size_of_val, str::from_utf8};
use std::process::Command;
#[cfg(target_os = "windows")]
use windows::{
    Win32::Foundation::*,
    Win32::System::Diagnostics::ToolHelp::{
        CreateToolhelp32Snapshot, Module32First, MODULEENTRY32, TH32CS_SNAPMODULE,
        TH32CS_SNAPMODULE32,
    },
};

#[cfg(target_os = "windows")]
pub fn get_process_path(pid: u32) -> Option<String> {
    unsafe {
        let mut path = None;
        let h_snap = CreateToolhelp32Snapshot(TH32CS_SNAPMODULE | TH32CS_SNAPMODULE32, pid);

        if let Ok(h_snap) = h_snap {
            if h_snap != INVALID_HANDLE_VALUE {
                let mut mod_entry: MODULEENTRY32 = MODULEENTRY32 {
                    ..Default::default()
                };
                mod_entry.dwSize = size_of_val(&mod_entry) as u32;
                if Module32First(h_snap, &mut mod_entry).is_ok() {
                    let char_vec = mod_entry
                        .szExePath
                        .iter()
                        .map(|f| f.to_owned())
                        .collect::<Vec<u8>>();

                    path = match from_utf8(&char_vec) {
                        Ok(s) => Some(String::from(s.to_string().trim_end_matches(char::from(0)))),
                        Err(_) => None,
                    };
                }
            }
            let c_result = CloseHandle(h_snap);
            if c_result.is_err() {
                error!("{:?}", c_result.err());
            }
        }
        path
    }
}

#[cfg(target_os = "windows")]
pub fn open_process_properties(pid: u32) -> Result<(), String> {
    use std::process::Command;

    use log::info;

    let file_path = get_process_path(pid);

    if file_path.is_none() {
        return Err(format!("Failed to retrieve file path from pid: {}", pid));
    }
    let path = &file_path.unwrap();
    let result = Command::new("explorer.exe")
        .args(&["/select,", path])
        .spawn();
    match result {
        Ok(_) => {
            info!("Opened process properties: {}", path);
            return Ok(());
        }
        Err(e) => {
            return Err(format!("Failed to open process properties: {}", e));
        }
    }
}

#[cfg(target_os = "macos")]
pub fn get_process_path(pid: u32) -> Option<String> {
    let output = Command::new("sh")
        .arg("-c")
        .arg(format!("ps -p {} -o comm=", pid))
        .output()
        .expect("Failed to execute command");
    
    if output.status.success() {
        let path = String::from_utf8(output.stdout).unwrap();
        Some(path.trim().to_string())
    } else {
        None
    }
}

#[cfg(target_os = "macos")]
pub fn open_process_properties(pid: u32) -> Result<(), String> {

    use log::info;

    let file_path = get_process_path(pid);

    if file_path.is_none() {
        return Err(format!("Failed to retrieve file path from pid: {}", pid));
    }
    let path = &file_path.unwrap();
    let result = Command::new("explorer.exe")
        .args(&["/select,", path])
        .spawn();
    match result {
        Ok(_) => {
            info!("Opened process properties: {}", path);
            return Ok(());
        }
        Err(e) => {
            return Err(format!("Failed to open process properties: {}", e));
        }
    }
}
