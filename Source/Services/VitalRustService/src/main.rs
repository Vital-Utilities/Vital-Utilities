#![windows_subsystem = "windows"]

use std::time::Duration;
use std::{thread, time::Instant};
extern crate nvml_wrapper as nvml;
use chrono::{DateTime, Utc};
use generated_vital_rust_service_api_def::SendProcessMainWindowTitleMappingRequest;
use log::{error, info, LevelFilter};
use log::{Level, Metadata, Record};

use nvml::{Device, NVML};
use sysinfo::{PidExt, ProcessorExt, SystemExt};
use systemstat::Platform;
use tokio::{join, try_join};

use crate::commands::get_vital_service_ports;
use crate::generated_vital_rust_service_api_def::{PidProcessTitleMapping, SendUtilizationRequest};
use crate::windows::get_mainwindowtitles;
mod api;
mod commands;
mod generated_client_api_dto_def;
mod generated_vital_rust_service_api_def;
mod nvidia;
mod windows;
use sysinfo::ProcessExt;
static LOGGER: SimpleLogger = SimpleLogger;
use api::post_request;

static WAIT_TIME: core::time::Duration = Duration::from_millis(1000);

#[tokio::main]
async fn main() {
    let _ = log::set_logger(&LOGGER).map(|()| log::set_max_level(LevelFilter::Info));

    let vital_service_port = get_vital_service_ports();
    if vital_service_port.is_err() {
        error!("{}", "failed to get vital service port");
        panic!("{}", "failed to get vital service port");
    }
    let nvml = NVML::init().unwrap();
    let mut sys_info = sysinfo::System::new_all();

    sys_info.refresh_all(); // required to get the correct usage as data relies on previous sample
    thread::sleep(WAIT_TIME);

    let sys_stat = systemstat::System::new();
    let device = nvml.device_by_index(0).unwrap();

    loop {
        thread::sleep(WAIT_TIME);
        let now = Instant::now();
        sys_info.refresh_all();
        let time = chrono::Utc::now();

        let mut id_process_tittle_mapping_vector = Vec::new();

        for (id, title) in get_mainwindowtitles() {
            id_process_tittle_mapping_vector.push(PidProcessTitleMapping {
                id: id as f64,
                title: title,
            });
        }
        let process_data = get_process_util(&sys_info, &device, time).unwrap();

        let (cpu_util, mem_util) =
            join!(get_cpu_util(&sys_info, &sys_stat), get_mem_util(&sys_info));

        //let mut gpu_usage = Vec::new();
        //#gpu_usage.push(nvidia::get_gpu_util(&device));

        if process_data.len() > 0 {
            let send_util = post_request(
                SendUtilizationRequest {
                    process_data,
                    system_usage: generated_vital_rust_service_api_def::SystemUsage {
                        cpu_usage: cpu_util,
                        mem_usage: mem_util,
                        //gpu_usage: gpu_usage,
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

            let send_map = post_request(
                SendProcessMainWindowTitleMappingRequest {
                    mappings: id_process_tittle_mapping_vector,
                },
                format!(
                    "https://localhost:{}/api/ingest/ProcessMainWindowTitleMapping",
                    vital_service_port
                        .as_ref()
                        .unwrap()
                        .vital_service_https_port
                ),
            );

            join!(send_util, send_map);
        } else {
            error!("no process data found");
        }
        info!("time taken: {}", now.elapsed().as_millis());
    }
}

fn get_process_util(
    sysinfo: &sysinfo::System,
    gpu_device: &Device,
    time_stamp: DateTime<Utc>,
) -> Option<Vec<generated_vital_rust_service_api_def::ProcessData>> {
    let mut list = Vec::new();
    let processes = sysinfo.processes();
    let gpu_usages = gpu_device.process_utilization_stats(None).unwrap();
    /*
    let using_compute = gpu_device.running_compute_processes().unwrap();
    let using_graphics = gpu_device.running_graphics_processes().unwrap();

    for p in using_compute {
        p.used_gpu_memory();
    } */

    let cores = sysinfo.physical_core_count();
    for (pid, process) in processes {
        let disk_bytes = process.disk_usage();
        let gpudata = &gpu_usages.iter().find(|x| x.pid == pid.as_u32());
        list.push(generated_vital_rust_service_api_def::ProcessData {
            name: process.name().to_string(),
            pid: pid.as_u32() as f64,
            parent_pid: if process.parent().is_some() {
                Some(process.parent().unwrap().as_u32() as f64)
            } else {
                None
            },
            cpu_percentage: (process.cpu_usage() / cores.unwrap() as f32) as f64,
            memory_kb: process.memory() as f64,
            disk_usage: generated_vital_rust_service_api_def::DiskUsage {
                read_bytes_per_second: disk_bytes.read_bytes as f64,
                write_bytes_per_second: disk_bytes.written_bytes as f64,
            },
            status: process.status().to_string(),
            gpu_core_percentage: if gpudata.is_some() {
                Some(gpudata.unwrap().sm_util as f64)
            } else {
                None
            },
            gpu_decoding_percentage: if gpudata.is_some() {
                Some(gpudata.unwrap().dec_util as f64)
            } else {
                None
            },
            gpu_encoding_percentage: if gpudata.is_some() {
                Some(gpudata.unwrap().enc_util as f64)
            } else {
                None
            },
            gpu_mem_percentage: if gpudata.is_some() {
                Some(gpudata.unwrap().mem_util as f64)
            } else {
                None
            },
            time_stamp: time_stamp.to_rfc3339(),
        });
    }
    return Some(list);
}

async fn get_mem_util(sysinfo: &sysinfo::System) -> generated_vital_rust_service_api_def::MemUsage {
    return generated_vital_rust_service_api_def::MemUsage {
        mem_percentage: sysinfo.used_memory() as f64 / sysinfo.total_memory() as f64 * 100 as f64,
        mem_total_kb: sysinfo.total_memory() as f64,
        mem_used_kb: sysinfo.used_memory() as f64,
        swap_percentage: sysinfo.used_swap() as f64 / sysinfo.total_swap() as f64 * 100 as f64,
        swap_total_kb: sysinfo.total_swap() as f64,
        swap_used_kb: sysinfo.used_swap() as f64,
    };
}

/* fn get_net_adapters(
    sysinfo: &sysinfo::System,
    sys_stat: &systemstat::System,
) -> Vec<generated_vital_rust_service_api_def::NetworkUsage> {
    let mut list = Vec::new();

    let nets = sys_stat.networks().unwrap();
    for (name, adapter) in nets {
        list.push(generated_vital_rust_service_api_def::NetworkUsage {
            name: adapter.name,
            ip_address: adapter.addrs[0].addr().,
            mac_address: adapter.mac_addr().to_string(),
        });
    }
    return list;
} */

async fn get_cpu_util(
    sysinfo: &sysinfo::System,
    sysstat: &systemstat::System,
) -> generated_vital_rust_service_api_def::CpuUsage {
    let mut core_percentages = Vec::new();
    let mut core_frequencies = Vec::new();
    for processor in sysinfo.processors() {
        core_percentages.push(processor.cpu_usage() as f64);
        core_frequencies.push(processor.frequency() as f64);
    }
    return generated_vital_rust_service_api_def::CpuUsage {
        cpu_percentage: sysinfo.global_processor_info().cpu_usage() as f64,
        core_percentages,
        core_frequencies,
        cpu_temp: sysstat.cpu_temp().unwrap_or(0.0) as f64,
    };
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
