#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
use std::time::Duration;
use std::{thread, time::Instant};
extern crate nvml_wrapper as nvml;
use log::{error, info, LevelFilter};
use log::{Level, Metadata, Record};

use crate::commands::get_vital_service_ports;
use crate::generated_vital_rust_service_api_def::SendUtilizationRequest;
use crate::software::get_process_util;
use nvml::NVML;
use sysinfo::SystemExt;
use systemstat::Platform;
use tokio::join;
mod api;
mod commands;
mod generated_client_api_dto_def;
mod generated_vital_rust_service_api_def;
mod machine;
mod nvidia;
pub mod software;

use api::post_request;
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
                    "http://localhost:{}/api/ingest/Utilization",
                    vital_service_port.as_ref().unwrap().vital_service_http_port
                ),
            );

            join!(send_util);
        } else {
            error!("no process data found");
        }
        info!("time taken: {}", now.elapsed().as_millis());
    }
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
