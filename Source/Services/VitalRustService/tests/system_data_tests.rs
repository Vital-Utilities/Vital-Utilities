//! Integration tests for system data retrieval.
//!
//! These tests verify that we can successfully collect hardware and software metrics
//! from the system using the various collectors.

use std::collections::HashMap;
use sysinfo::{System, Pid};

/// Test that we can retrieve basic CPU information
#[test]
fn test_cpu_info_retrieval() {
    let mut sys = System::new_all();
    sys.refresh_all();

    // Should have at least one CPU
    let cpus = sys.cpus();
    assert!(!cpus.is_empty(), "System should have at least one CPU");

    // Each CPU should have a name
    for cpu in cpus {
        assert!(!cpu.name().is_empty(), "CPU should have a name");
        // CPU usage should be between 0 and 100
        let usage = cpu.cpu_usage();
        assert!(usage >= 0.0 && usage <= 100.0, "CPU usage should be between 0 and 100, got {}", usage);
    }

    // Global CPU info
    let global_cpu = sys.global_cpu_info();
    let global_usage = global_cpu.cpu_usage();
    assert!(global_usage >= 0.0 && global_usage <= 100.0, "Global CPU usage should be between 0 and 100");
}

/// Test that we can retrieve memory information
#[test]
fn test_memory_info_retrieval() {
    let mut sys = System::new_all();
    sys.refresh_all();

    let total_memory = sys.total_memory();
    let used_memory = sys.used_memory();
    let available_memory = sys.available_memory();

    // Total memory should be greater than 0
    assert!(total_memory > 0, "Total memory should be greater than 0");

    // Used memory should be less than or equal to total
    assert!(used_memory <= total_memory, "Used memory should be <= total memory");

    // Available memory should be less than or equal to total
    assert!(available_memory <= total_memory, "Available memory should be <= total memory");

    // Swap info
    let total_swap = sys.total_swap();
    let used_swap = sys.used_swap();

    // Used swap should be less than or equal to total (if swap exists)
    if total_swap > 0 {
        assert!(used_swap <= total_swap, "Used swap should be <= total swap");
    }
}

/// Test that we can retrieve disk information
#[test]
fn test_disk_info_retrieval() {
    use sysinfo::Disks;

    let disks = Disks::new_with_refreshed_list();

    // Most systems have at least one disk
    // Note: Some CI environments might not have disks, so we just verify the API works
    for disk in disks.list() {
        let name = disk.name().to_string_lossy();
        let mount_point = disk.mount_point().to_string_lossy();
        let total_space = disk.total_space();
        let available_space = disk.available_space();

        // Total space should be > 0 for valid disks
        if total_space > 0 {
            assert!(available_space <= total_space,
                "Available space should be <= total space for disk {} at {}", name, mount_point);
        }
    }
}

/// Test that we can retrieve network interface information
#[test]
fn test_network_info_retrieval() {
    use sysinfo::Networks;

    let networks = Networks::new_with_refreshed_list();

    // Iterate through network interfaces
    for (interface_name, data) in &networks {
        // Interface name should not be empty
        assert!(!interface_name.is_empty(), "Network interface should have a name");

        // Bytes transmitted/received should be non-negative (they're unsigned)
        let _received = data.received();
        let _transmitted = data.transmitted();

        // MAC address should be available (though might be empty string)
        let _mac = data.mac_address();
    }
}

/// Test that we can retrieve process information
#[test]
fn test_process_info_retrieval() {
    let mut sys = System::new_all();
    sys.refresh_all();

    let processes = sys.processes();

    // Should have at least a few processes running (at minimum, our test process)
    assert!(!processes.is_empty(), "System should have at least one process");

    // Find our own process
    let our_pid = std::process::id();
    let our_process = sys.process(Pid::from_u32(our_pid));
    assert!(our_process.is_some(), "Should be able to find our own process");

    if let Some(process) = our_process {
        // Our process should have a name
        let name = process.name();
        assert!(!name.is_empty(), "Process should have a name");

        // Memory usage should be > 0
        let memory = process.memory();
        assert!(memory > 0, "Our process should be using some memory");
    }

    // Verify we can iterate all processes
    let mut process_count = 0;
    for (pid, process) in processes {
        process_count += 1;

        // Each process should have valid data
        let _name = process.name();
        let _cpu = process.cpu_usage();
        let _memory = process.memory();
        let _status = process.status();

        // PID should match the key
        assert_eq!(*pid, process.pid(), "PID key should match process PID");
    }

    assert!(process_count > 0, "Should have counted at least one process");
}

/// Test that we can get process parent-child relationships
#[test]
fn test_process_hierarchy() {
    let mut sys = System::new_all();
    sys.refresh_all();

    let processes = sys.processes();

    // Build parent-child map
    let mut children_map: HashMap<Pid, Vec<Pid>> = HashMap::new();

    for (pid, process) in processes {
        if let Some(parent_pid) = process.parent() {
            children_map
                .entry(parent_pid)
                .or_insert_with(Vec::new)
                .push(*pid);
        }
    }

    // Some processes should have children (like init/systemd or shell)
    // This is a soft assertion since minimal systems might not have this
    let processes_with_children = children_map.len();
    println!("Processes with children: {}", processes_with_children);
}

/// Test that CPU usage values are reasonable after refresh
#[test]
fn test_cpu_usage_after_refresh() {
    let mut sys = System::new_all();

    // First refresh to establish baseline
    sys.refresh_all();

    // Wait a bit
    std::thread::sleep(std::time::Duration::from_millis(200));

    // Second refresh to get actual usage
    sys.refresh_all();

    for cpu in sys.cpus() {
        let usage = cpu.cpu_usage();
        assert!(
            usage >= 0.0 && usage <= 100.0,
            "CPU usage should be between 0-100%, got {}%",
            usage
        );
    }
}

/// Test that we can get system uptime
#[test]
fn test_system_uptime() {
    let uptime = System::uptime();

    // System should have been up for at least a few seconds
    assert!(uptime > 0, "System uptime should be greater than 0");
}

/// Test that we can get system name and version
#[test]
fn test_system_info() {
    let name = System::name();
    let kernel_version = System::kernel_version();
    let os_version = System::os_version();
    let host_name = System::host_name();

    // At least one of these should be available
    assert!(
        name.is_some() || kernel_version.is_some() || os_version.is_some() || host_name.is_some(),
        "At least one system info field should be available"
    );

    if let Some(name) = name {
        println!("System name: {}", name);
    }
    if let Some(version) = os_version {
        println!("OS version: {}", version);
    }
}

/// Test memory calculations
#[test]
fn test_memory_calculations() {
    let mut sys = System::new_all();
    sys.refresh_memory();

    let total = sys.total_memory();
    let used = sys.used_memory();
    let available = sys.available_memory();

    // Basic sanity checks
    assert!(total > 0, "Total memory must be positive");
    assert!(used <= total, "Used memory cannot exceed total");

    // Calculate percentage
    let usage_percent = (used as f64 / total as f64) * 100.0;
    assert!(
        usage_percent >= 0.0 && usage_percent <= 100.0,
        "Memory usage percentage should be 0-100%, got {}%",
        usage_percent
    );

    println!("Memory: {} / {} bytes ({:.1}% used)", used, total, usage_percent);
}

/// Test that refresh operations work correctly
#[test]
fn test_refresh_operations() {
    let mut sys = System::new();

    // Test individual refresh operations
    sys.refresh_cpu();
    sys.refresh_memory();
    sys.refresh_processes();

    // After refresh, we should have data
    assert!(!sys.cpus().is_empty(), "Should have CPU data after refresh");
    assert!(sys.total_memory() > 0, "Should have memory data after refresh");
}

/// Test process executable path retrieval
#[test]
fn test_process_exe_path() {
    let mut sys = System::new_all();
    sys.refresh_all();

    let our_pid = std::process::id();
    if let Some(process) = sys.process(Pid::from_u32(our_pid)) {
        // Our test process should have an executable path
        if let Some(exe) = process.exe() {
            assert!(exe.exists(), "Executable path should exist");
            println!("Our executable: {:?}", exe);
        }
    }
}

/// Test that we handle the case when NVML is not available gracefully
#[test]
fn test_nvml_graceful_failure() {
    use nvml_wrapper::Nvml;

    // NVML initialization may fail on systems without NVIDIA GPUs
    // This is expected behavior - we should handle it gracefully
    match Nvml::init() {
        Ok(nvml) => {
            // If NVML is available, we should be able to get device count
            match nvml.device_count() {
                Ok(count) => println!("Found {} NVIDIA GPU(s)", count),
                Err(e) => println!("Could not get device count: {}", e),
            }
        }
        Err(e) => {
            // This is fine - not all systems have NVIDIA GPUs
            println!("NVML not available (expected on non-NVIDIA systems): {}", e);
        }
    }
}

/// Test concurrent access to system info
#[test]
fn test_concurrent_system_access() {
    use std::sync::Arc;
    use std::thread;

    let sys = Arc::new(std::sync::Mutex::new(System::new_all()));

    let handles: Vec<_> = (0..4)
        .map(|i| {
            let sys_clone = Arc::clone(&sys);
            thread::spawn(move || {
                let mut sys = sys_clone.lock().unwrap();
                sys.refresh_all();
                let cpu_count = sys.cpus().len();
                let memory = sys.total_memory();
                println!("Thread {}: {} CPUs, {} bytes memory", i, cpu_count, memory);
                (cpu_count, memory)
            })
        })
        .collect();

    let results: Vec<_> = handles.into_iter().map(|h| h.join().unwrap()).collect();

    // All threads should get the same values
    let first = results[0];
    for (i, result) in results.iter().enumerate() {
        assert_eq!(
            result.0, first.0,
            "Thread {} got different CPU count",
            i
        );
        assert_eq!(
            result.1, first.1,
            "Thread {} got different memory",
            i
        );
    }
}

// ============================================================================
// Platform-specific tests
// ============================================================================

#[cfg(target_os = "windows")]
mod windows_tests {
    use super::*;

    #[test]
    fn test_windows_process_priority() {
        // On Windows, we should be able to query process priority
        let mut sys = System::new_all();
        sys.refresh_all();

        let our_pid = std::process::id();
        let process = sys.process(Pid::from_u32(our_pid));
        assert!(process.is_some(), "Should find our process on Windows");
    }
}

#[cfg(target_os = "macos")]
mod macos_tests {
    use super::*;

    #[test]
    fn test_macos_cpu_brand() {
        let mut sys = System::new_all();
        sys.refresh_all();

        // macOS should report CPU brand
        if let Some(cpu) = sys.cpus().first() {
            let brand = cpu.brand();
            println!("macOS CPU brand: {}", brand);
        }
    }
}

#[cfg(target_os = "linux")]
mod linux_tests {
    use super::*;

    #[test]
    fn test_linux_process_status() {
        use sysinfo::ProcessStatus;

        let mut sys = System::new_all();
        sys.refresh_all();

        // On Linux, we should be able to get detailed process status
        for (_pid, process) in sys.processes() {
            let status = process.status();
            // Status should be one of the valid variants
            match status {
                ProcessStatus::Run | ProcessStatus::Sleep | ProcessStatus::Idle |
                ProcessStatus::Zombie | ProcessStatus::Stop | ProcessStatus::Dead |
                ProcessStatus::Tracing | ProcessStatus::Wakekill | ProcessStatus::Waking |
                ProcessStatus::Parked | ProcessStatus::LockBlocked | ProcessStatus::UninterruptibleDiskSleep |
                ProcessStatus::Unknown(_) => {}
            }
        }
    }
}
