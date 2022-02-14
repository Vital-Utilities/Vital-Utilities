use std::thread;
use std::time::{Duration, SystemTime};
extern crate nvml_wrapper as nvml;
use nvml::{Device, NVML};
use sysinfo::ProcessExt;
use sysinfo::{DiskExt, System, SystemExt};
mod generated_api_def;
fn main() {
    let nvml = NVML::init().unwrap();
    let mut sys = System::new_all();
    let device = nvml.device_by_index(0).unwrap();
    print!("{}", device.name().unwrap());

    loop {
        thread::sleep(Duration::from_millis(2000));
        sys.refresh_all();

        let gpu_usage = get_process_gpu_data(&device);
        match gpu_usage {
            Some(usage) => {
                for process in usage {
                    println!("{}", process.gpu_core_percentage);
                }
            }
            None => {
                println!("No process found");
            }
        }
    }
}

fn get_process_gpu_data(device: &Device) -> Option<Vec<generated_api_def::Process>> {
    let processes = device.process_utilization_stats(None).unwrap();

    let mut list = Vec::new();
    for sample in processes {
        let process = generated_api_def::Process {
            pid: sample.pid.into(),
            gpu_core_percentage: sample.sm_util.into(),
            time_stamp: sample.timestamp.to_string(),
        };
        list.push(process);
    }
    return Some(list);
}

fn get_gpu_data(device: &Device) {
    println!("{}", device.name().unwrap());

    let temp = device
        .temperature(nvml::enum_wrappers::device::TemperatureSensor::Gpu)
        .unwrap();

    let power = device.power_usage().unwrap();
    let processes = device.process_utilization_stats(None).unwrap();
    println!("temp:{}c", temp);
    println!("power:{}", power);
    println!("processes:{:?}", processes);
}

// fn get_cpu_data(sys: &System) {
//     for (pid, process) in sys.processes() {
//         let window = windows::Win32::UI::WindowsAndMessaging::TILE_WINDOWS_HOW(pid.into());
//         println!("[{}] {} {:?}", pid, process.name(), process.cpu_usage(),);
//     }
// }
