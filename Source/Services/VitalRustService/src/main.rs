#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
use std::time::Duration;
use std::{thread, time::Instant};
extern crate nvml_wrapper as nvml;
use crate::commands::get_vital_service_ports;
use crate::software::get_process_util;
use log::{error, info, LevelFilter};
use log::{Level, Metadata, Record};
use nvml::Nvml;
use vital_service_api::models::{SendUtilizationRequest, SystemUsage};

use rocket::routes;

use sysinfo::SystemExt;
use systemstat::Platform;
use tokio::join;
mod api;
mod commands;
mod machine;
mod nvidia;
pub mod rocket_endpoints;
pub mod software;

use api::post_request;
static LOGGER: SimpleLogger = SimpleLogger;
static SECOND: core::time::Duration = Duration::from_millis(1000);

#[rocket::main]
async fn main() {
    let _ = log::set_logger(&LOGGER).map(|()| log::set_max_level(LevelFilter::Info));
    tokio::spawn(rocket());

    app().await;
}
async fn app() {
    let vital_service_port = get_vital_service_ports();
    if vital_service_port.is_err() {
        error!("{}", "failed to get vital service port");
        panic!("{}", "failed to get vital service port");
    }
    let nvml_result = Nvml::init();
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
    thread::sleep(SECOND);
    loop {
        let now = Instant::now();

        sys_info.refresh_all();
        let time = chrono::Utc::now();

        let process_data = get_process_util(&sys_info, &nvml, time).unwrap();

        let (cpu_util, mem_util, net_util, disk_usage, gpu_usage) = join!(
            machine::get_cpu_util(&sys_info, &sys_stat),
            machine::get_mem_util(&sys_info),
            machine::get_net_adapters(&sys_info),
            machine::get_disk_util(&sys_info),
            machine::get_gpu_util(&nvml),
        );

        if !process_data.is_empty() {
            let send_util = post_request(
                SendUtilizationRequest {
                    process_data,
                    system_usage: Box::new(SystemUsage {
                        cpu_usage: cpu_util,
                        mem_usage: Box::new(mem_util),
                        network_adapter_usage: net_util,
                        disk_usage: *disk_usage,
                        gpu_usage,
                    }),
                },
                format!(
                    "http://localhost:{}/api/ingest/Utilization",
                    vital_service_port
                        .to_owned()
                        .unwrap()
                        .vital_service_http_port
                ),
            );

            join!(send_util);
        } else {
            error!("no process data found");
        }
        info!("time taken: {}", now.elapsed().as_millis());

        if now.elapsed().as_millis() < SECOND.as_millis() {
            thread::sleep(Duration::from_millis(
                (SECOND.as_millis() - now.elapsed().as_millis()) as u64,
            ));
        }
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

async fn rocket() -> Result<(), rocket::Error> {
    let _rocket = rocket::build()
        .mount("/", routes![rocket_endpoints::ideal_processors])
        .launch()
        .await?;

    Ok(())
}
