#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
use std::collections::HashMap;
use std::string;
use std::time::Duration;
use std::{thread, time::Instant};
extern crate nvml_wrapper as nvml;
use chrono::{DateTime, Utc};
use generated_vital_rust_service_api_def::{
    DiskLoad, DiskThroughput, NetworkAdapterProperties, NetworkAdapterUsage, NetworkAdapterUtil,
    ProcessGpuUtil,
};
use log::{error, info, LevelFilter};
use log::{Level, Metadata, Record};

use crate::commands::get_vital_service_ports;
use crate::generated_vital_rust_service_api_def::{PidProcessTitleMapping, SendUtilizationRequest};
use nvml::{struct_wrappers::device::ProcessUtilizationSample, NVML};
use sysinfo::{
    ComponentExt, DiskExt, DiskType, NetworkExt, PidExt, Process, ProcessorExt, SystemExt,
};
use systemstat::Platform;
use tokio::join;
mod api;
mod commands;
mod generated_client_api_dto_def;
mod generated_vital_rust_service_api_def;
mod machine;
mod nvidia;
mod windows;
use api::post_request;
use sysinfo::ProcessExt;
static LOGGER: SimpleLogger = SimpleLogger;
static WAIT_TIME: core::time::Duration = Duration::from_millis(1000);

#[tokio::main]
async fn main() {
    let _ = log::set_logger(&LOGGER).map(|()| log::set_max_level(LevelFilter::Info));

    let vital_service_port = get_vital_service_ports();
    if vital_service_port.is_err() {
        error!("{}", "failed to get vital service port");
        panic!("{}", "failed to get vital service port");
    }
    let nvml_result = NVML::init();
    let nvml = match nvml_result {
        Ok(nvml) => Some(nvml),
        Err(e) => {
            error!("{}", e);
            None
        }
    };

    let sys_stat = systemstat::System::new();

    let mut sys_info = sysinfo::System::new_all();
    sys_info.refresh_all(); // required to get the correct usage as data relies on previous sample
    loop {
        thread::sleep(WAIT_TIME);
        let now = Instant::now();
        sys_info.refresh_all();
        let time = chrono::Utc::now();

        let process_data = get_process_util(&sys_info, &nvml, time).unwrap();

        let (cpu_util, mem_util, adapter_util, disk) = join!(
            machine::get_cpu_util(&sys_info, &sys_stat),
            machine::get_mem_util(&sys_info),
            machine::get_net_adapters(&sys_info),
            machine::get_disk_util(&sys_info),
        );

        //let mut gpu_usage = Vec::new();
        //#gpu_usage.push(nvidia::get_gpu_util(&device));

        if process_data.len() > 0 {
            let send_util = post_request(
                SendUtilizationRequest {
                    process_data,
                    system_usage: generated_vital_rust_service_api_def::SystemUsage {
                        cpu_usage: cpu_util,
                        mem_usage: mem_util,
                        network_adapter_usage: adapter_util,
                        disk, //gpu_usage: gpu_usage,
                    },
                },
                format!(
                    "https://localhost:{}/api/ingest/Utilization",
                    vital_service_port
                        .as_ref()
                        .unwrap()
                        .vital_service_https_port
                ),
            );

            join!(send_util);
        } else {
            error!("no process data found");
        }
        info!("time taken: {}", now.elapsed().as_millis());
    }
}

fn get_process_util(
    sysinfo: &sysinfo::System,
    nvml: &Option<NVML>,
    time_stamp: DateTime<Utc>,
) -> Option<Vec<generated_vital_rust_service_api_def::ProcessData>> {
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
    let main_window_titles = windows::get_mainwindowtitles();
    for (pid, process) in processes {
        let disk_bytes = process.disk_usage();
        // get first gpu usage that has this pid

        let pid = pid.as_u32();
        let path = windows::get_process_Path(pid); // takes some time

        /*  let proc = winproc::Process::from_id(pid as u32).unwrap();
        let n = proc.threads().unwrap();
               for e in n {
            let t = e;
            let thread_id = t.id();
            info!("{:?} {:?}", thread_id, t.ideal_processor());
        } */
        list.push(generated_vital_rust_service_api_def::ProcessData {
            name: process.name().to_string(),
            pid: pid as f64,
            main_window_title: match main_window_titles.get(&pid) {
                Some(title) => Some(title.to_string()),
                None => None,
            },
            description: None,
            executable_path: path,
            parent_pid: match process.parent() {
                Some(pid) => Some(pid.as_u32() as f64),
                None => None,
            },
            cpu_percentage: (process.cpu_usage() / cores.unwrap() as f32) as f64,
            memory_kb: process.memory() as f64,
            disk_usage: generated_vital_rust_service_api_def::ProcessDiskUsage {
                read_bytes_per_second: disk_bytes.read_bytes as f64,
                write_bytes_per_second: disk_bytes.written_bytes as f64,
            },
            status: Some(process.status().to_string()),
            gpu_util: match process_gpu_utilization_samples
                .iter()
                .find(|sample| sample.pid == pid)
            {
                Some(util) => Some(ProcessGpuUtil {
                    gpu_core_percentage: Some(util.sm_util as f64),
                    gpu_decoding_percentage: Some(util.dec_util as f64),
                    gpu_encoding_percentage: Some(util.enc_util as f64),
                    gpu_mem_percentage: Some(util.mem_util as f64),
                }),
                None => None,
            },

            time_stamp: time_stamp.to_rfc3339(),
        });
    }
    return Some(list);
}

struct SimpleLogger;

impl log::Log for SimpleLogger {
    fn enabled(&self, metadata: &Metadata) -> bool {
        metadata.level() <= Level::Info
    }

    fn log(&self, record: &Record) {
        if self.enabled(record.metadata()) {
            println!("{} - {}", record.level(), record.args());
        }
    }

    fn flush(&self) {}
}
