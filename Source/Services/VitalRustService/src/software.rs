use crate::nvidia;
use chrono::{DateTime, Utc};
use core::slice;
use nvml::Nvml;
use once_cell::sync::OnceCell;
use vital_service_api::models::{ProcessData, ProcessDiskUsage, ProcessGpuUtil};

use std::{
    collections::{HashMap, HashSet},
    mem::size_of_val,
    path::Path,
    ptr::null_mut,
    str::from_utf8,
    sync::Mutex,
};
use sysinfo::{PidExt, ProcessExt, SystemExt};
use windows::{
    Win32::Foundation::*,
    Win32::{
        Storage::FileSystem::{GetFileVersionInfoSizeW, GetFileVersionInfoW, VerQueryValueW},
        System::Diagnostics::ToolHelp::{
            CreateToolhelp32Snapshot, Module32First, MODULEENTRY32, TH32CS_SNAPMODULE,
            TH32CS_SNAPMODULE32,
        },
        UI::WindowsAndMessaging::*,
    },
};
pub fn get_process_util(
    sysinfo: &sysinfo::System,
    nvml: &Option<Nvml>,
    time_stamp: DateTime<Utc>,
) -> Option<Vec<ProcessData>> {
    let mut list = Vec::new();
    let processes = sysinfo.processes();

    let process_gpu_utilization_samples = nvidia::get_process_gpu_util(&nvml).unwrap_or(Vec::new());
    /*
    let using_compute = gpu_device.running_compute_processes().unwrap();
    let using_graphics = gpu_device.running_graphics_processes().unwrap();

    for p in using_compute {
        p.used_gpu_memory();
    } */

    let cores = sysinfo.physical_core_count();
    let main_window_titles = get_mainwindowtitles();
    for (pid, process) in processes {
        let disk_bytes = process.disk_usage();
        // get first gpu usage that has this pid

        let pid = pid.as_u32();
        let path = get_process_path(pid); // takes some time

        let mut description: Option<String> = None; // takes some time
                                                    /*         if path.is_some() {
                                                        description = match windows::get_file_description(path.to_owned().unwrap().to_string())
                                                        {
                                                            Ok(title) => Some(title),
                                                            Err(_) => None,
                                                        };
                                                    }; */
        // windows::get_process_ideal_processors(pid); //takes a lot of time
        list.push(ProcessData {
            pid: pid as i32,
            parent_pid: match process.parent() {
                Some(pid) => Some(pid.as_u32() as i32),
                None => None,
            },
            executable_path: path,
            description,
            main_window_title: match main_window_titles.get(&pid) {
                Some(title) => Some(title.to_string()),
                None => None,
            },
            name: process.name().to_string(),
            time_stamp: time_stamp.to_rfc3339(),
            cpu_percentage: (process.cpu_usage() / cores.unwrap() as f32) as f32,
            memory_kb: process.memory() as i64,
            disk_usage: Box::new(ProcessDiskUsage {
                read_bytes_per_second: disk_bytes.read_bytes as i64,
                write_bytes_per_second: disk_bytes.written_bytes as i64,
            }),
            status: Some(process.status().to_string()),

            gpu_util: match process_gpu_utilization_samples
                .iter()
                .find(|sample| sample.pid == pid)
            {
                Some(util) => Some(Box::new(ProcessGpuUtil {
                    gpu_core_percentage: Some(util.sm_util as f32),
                    gpu_decoding_percentage: Some(util.dec_util as f32),
                    gpu_encoding_percentage: Some(util.enc_util as f32),
                    gpu_mem_percentage: Some(util.mem_util as f32),
                })),
                None => None,
            },
        });
    }
    return Some(list);
}

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
    let mut text = [0; 1024];
    let length = GetWindowTextW(hwnd, &mut text);
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

fn get_process_path(pid: u32) -> Option<String> {
    let mut path = None;
    unsafe {
        let h_snap = CreateToolhelp32Snapshot(TH32CS_SNAPMODULE | TH32CS_SNAPMODULE32, pid);

        if let Ok(h_snap) = h_snap {
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
