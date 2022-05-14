use core::slice;
use std::{
    collections::{HashMap, HashSet},
    ffi::{c_void, CString},
    mem::size_of_val,
    path::Path,
    ptr::null_mut,
    str::from_utf8,
    sync::Mutex,
};

use log::info;
use once_cell::sync::OnceCell;
use serde::__private::from_utf8_lossy;
use serde::de::Error;
use windows::{
    core::{PCSTR, PSTR, PWSTR},
    Win32::Foundation::*,
    Win32::{
        Storage::FileSystem::{
            GetFileInformationByHandle, GetFileVersionInfoA, GetFileVersionInfoSizeA,
            GetFileVersionInfoSizeW, GetFileVersionInfoW, VerQueryValueA, VerQueryValueW,
        },
        System::Diagnostics::ToolHelp::{
            CreateToolhelp32Snapshot, Module32First, MODULEENTRY32, TH32CS_SNAPMODULE,
            TH32CS_SNAPMODULE32,
        },
        UI::WindowsAndMessaging::*,
    },
};

static WINDOW_TITLES: OnceCell<Mutex<HashMap<u32, String>>> = OnceCell::new();

// function that gets all running windows and their titles
#[cfg(target_os = "windows")]
pub fn get_mainwindowtitles() -> HashMap<u32, String> {
    let main_window_titles;

    unsafe {
        let mut guard = WINDOW_TITLES
            .get_or_init(|| Mutex::new(HashMap::new()))
            .lock()
            .unwrap();
        guard.clear();
        std::mem::drop(guard);

        loop {
            if EnumWindows(lpfn(), None) == true {
                break;
            }
        }

        let guard = WINDOW_TITLES
            .get_or_init(|| Mutex::new(HashMap::new()))
            .lock()
            .unwrap();

        main_window_titles = guard.clone();
        std::mem::drop(&guard);
    }

    return main_window_titles;
}

fn lpfn() -> windows::Win32::UI::WindowsAndMessaging::WNDENUMPROC {
    return handle();
}

fn handle() -> Option<unsafe extern "system" fn(hwnd: HWND, lparam: LPARAM) -> BOOL> {
    return Some(callback);
}

unsafe extern "system" fn callback(hwnd: HWND, _: LPARAM) -> BOOL {
    let mut text: [u16; 1024] = [0; 1024];
    let length = GetWindowTextW(hwnd, PWSTR(text.as_mut_ptr()), text.len() as i32);
    let text = String::from_utf16(&text[..length as usize]).unwrap();

    let mut guard = WINDOW_TITLES
        .get_or_init(|| Mutex::new(HashMap::new()))
        .lock()
        .unwrap();

    let mut id: u32 = 0;

    GetWindowThreadProcessId(hwnd, &mut id);
    if (text.contains("Default IME")
        || text.contains("MSCTFIME UI")
        || text.contains("GDI+ Window")
        || text == "")
        == false
        && IsWindowVisible(hwnd) == true
    {
        guard.insert(id, text);
    }
    std::mem::drop(guard);

    return true.into();
}

pub fn get_file_description(path: impl AsRef<Path>) -> Result<String, String> {
    // Determine version info size
    let size = unsafe { GetFileVersionInfoSizeW(path.as_ref().as_os_str(), null_mut()) };
    if size == 0 {
        return Err("".to_string());
    }

    // Allocate buffer
    let mut buffer = vec![0u8; size as usize];
    // Read version info
    unsafe {
        GetFileVersionInfoW(
            path.as_ref().as_os_str(),
            0,
            size,
            buffer.as_mut_ptr() as *mut std::ffi::c_void,
        );
    }

    // Declare pointer/size pair for output
    let mut ptr = null_mut();
    let mut len = 0;
    // Query for file description
    let success = unsafe {
        VerQueryValueW(
            buffer.as_ptr() as *const std::ffi::c_void,
            "\\StringFileInfo\\040904B0\\FileDescription",
            &mut ptr,
            &mut len,
        )
    }
    // The API call doesn't set the last error code so we cannot use `.ok()?` here
    .as_bool();
    if !success {
        return Err("Failed to query file description".into());
    }

    // `len` here is in elements (as opposed to bytes)
    let descr = unsafe { slice::from_raw_parts(ptr as *const u16, len as usize) };
    // Optionally use `from_utf16_lossy` if you don't need to handle invalid UTF-16
    let descr = String::from_utf16(descr);
    match descr {
        Ok(descr) => Ok(descr),
        Err(_) => Err("Failed to convert file description to UTF-16".into()),
    }
}

pub fn get_process_Path(pid: u32) -> Option<String> {
    let mut path = None;
    unsafe {
        let h_snap = CreateToolhelp32Snapshot(TH32CS_SNAPMODULE | TH32CS_SNAPMODULE32, pid);

        if h_snap != INVALID_HANDLE_VALUE {
            let mut mod_entry: MODULEENTRY32 = MODULEENTRY32 {
                ..Default::default()
            };
            mod_entry.dwSize = size_of_val(&mod_entry) as u32;
            if Module32First(h_snap, &mut mod_entry).as_bool() {
                let char_vec = mod_entry.szExePath.iter().map(|f| f.0).collect::<Vec<u8>>();

                path = match from_utf8(&char_vec) {
                    Ok(s) => Some(String::from(s.to_string().trim_end_matches(char::from(0)))),
                    Err(_) => None,
                };
            }
        }
        CloseHandle(h_snap);
    }

    return path;
}

pub fn get_process_ideal_processors(pid: u32) -> HashSet<u32> {
    let proc = winproc::Process::from_id(pid as u32);
    let mut ideal_processors = HashSet::new();
    match proc {
        Ok(proc) => {
            let threads = proc.threads().unwrap();
            for thread in threads {
                match thread.ideal_processor() {
                    Ok(ideal_processor) => {
                        ideal_processors.insert(ideal_processor);
                    }
                    Err(_) => {}
                }
            }
        }
        Err(_) => {}
    }

    return ideal_processors;
}
