use std::{
    collections::HashMap,
    ffi::{c_void, CString},
    mem::size_of_val,
    str::from_utf8,
    sync::Mutex,
};

use log::info;
use once_cell::sync::OnceCell;
use serde::__private::from_utf8_lossy;
use windows::{
    core::{PCSTR, PSTR, PWSTR},
    Win32::Foundation::*,
    Win32::{
        Storage::FileSystem::{
            GetFileInformationByHandle, GetFileVersionInfoA, GetFileVersionInfoSizeA,
            GetFileVersionInfoW, VerQueryValueA,
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

pub fn get_process_product_name(path: String) -> Option<String> {
    let mut name = None;
    unsafe {
        let mut infoBuffer: [u8; 2048] = [0; 2048];
        let pat = &path;
        let infoPtr = infoBuffer.as_mut_ptr() as *mut c_void;
        let c_str = CString::new(pat.as_str()).unwrap();
        let pstr = PCSTR(c_str.as_ptr() as *const u8);
        let verInfoLen = GetFileVersionInfoSizeA(pstr, &mut 0);
        let ok = GetFileVersionInfoA(pstr, 0, verInfoLen, infoPtr).as_bool();

        let mut nameBuffer: [u8; 2048] = [0; 2048];
        let namePtr = nameBuffer.as_mut_ptr() as *mut *mut c_void;
        let mut nameLen = 0;
        if ok
            && VerQueryValueA(
                infoPtr,
                "\\StringFileInfo\\040904e4\\ProductName",
                namePtr,
                &mut nameLen,
            )
            .as_bool()
        {
            let res = from_utf8_lossy(&nameBuffer);
            name = Some(res.to_string());
        }
    }
    return name;
}
