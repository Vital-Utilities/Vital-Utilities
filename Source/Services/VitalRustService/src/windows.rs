use std::{collections::HashMap, ops::Deref, sync::Mutex};

use once_cell::sync::OnceCell;
use windows::{Win32::Foundation::*, Win32::UI::WindowsAndMessaging::*};

static WINDOW_TITLES: OnceCell<Mutex<HashMap<u32, String>>> = OnceCell::new();

// function that gets all running windows and their titles
#[cfg(target_os = "windows")]
pub fn get_mainwindowtitles() -> HashMap<u32, String> {
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

        let toreturn = guard.deref().clone();
        std::mem::drop(guard);
        return toreturn;
    }
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
    //let exists = guard.keys().find(|&x| *x == id);
    if (text.contains("Default IME")
        || text.contains("MSCTFIME UI")
        || text.contains("GDI+ Window")
        || text == "")
        == false
        && IsWindowVisible(hwnd) == true
    {
        guard.insert(id, text.clone());
    }
    std::mem::drop(guard);

    return true.into();
}

// function that takes hwnd and returns process id
fn get_pid(hwnd: HWND) -> u32 {
    unsafe {
        let mut pid: u32 = 0;
        GetWindowThreadProcessId(hwnd, &mut pid);
        return pid;
    }
}

/*

pub fn f() -> bool {
    unsafe {
        let hProcessSnap = windows::Win32::System::Diagnostics::ToolHelp::CreateToolhelp32Snapshot(
            windows::Win32::System::Diagnostics::ToolHelp::TH32CS_SNAPPROCESS,
            0,
        );

        let mut pe32: windows::Win32::System::Diagnostics::ToolHelp::PROCESSENTRY32;

        if hProcessSnap == INVALID_HANDLE_VALUE {
            error!("CreateToolhelp32Snapshot (of processes)");
            return false;
        }
        pe32.dwSize =
            size_of::<windows::Win32::System::Diagnostics::ToolHelp::PROCESSENTRY32>() as u32;

        if windows::Win32::System::Diagnostics::ToolHelp::Process32First(hProcessSnap, &mut pe32)
            == false
        {
            error!("Process32First"); // show cause of failure
            windows::Win32::Foundation::CloseHandle(hProcessSnap); // clean the snapshot object
            return false;
        }

        let mut list = Vec::new();
        loop {
            let mut dwPriorityClass = 0;
            let hProcess = OpenProcess(PROCESS_ALL_ACCESS, false, pe32.th32ProcessID);
            if hProcess.is_invalid() {
                error!("OpenProcess");
                continue;
            }

            list.push(ProcessTitle {
                pid: pe32.th32ProcessID,
                title: Some(" ".to_string()),
            });

            if windows::Win32::System::Diagnostics::ToolHelp::Process32Next(hProcessSnap, &mut pe32)
                == false
            {
                break;
            }
        }

        return true;
    }
} */

struct ProcessTitle {
    pub pid: u32,
    pub title: Option<String>,
}
