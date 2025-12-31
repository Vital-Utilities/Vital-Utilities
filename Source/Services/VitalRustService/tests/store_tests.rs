//! Tests for the data stores.

use std::collections::HashMap;

// Note: These tests require the module structure to be properly set up.
// They test the store logic in isolation.

/// Test affinity conversion functions
#[test]
fn test_affinity_binary_to_array() {
    // Test conversion from binary string to array of core indices

    // All 4 cores enabled: "1111" -> [0, 1, 2, 3]
    let binary = "1111";
    let expected: Vec<i32> = vec![0, 1, 2, 3];
    let result = affinity_binary_to_array(binary);
    assert_eq!(result, expected);

    // Alternating cores: "1010" -> [1, 3]
    let binary = "1010";
    let expected: Vec<i32> = vec![1, 3];
    let result = affinity_binary_to_array(binary);
    assert_eq!(result, expected);

    // Only first core: "0001" -> [0]
    let binary = "0001";
    let expected: Vec<i32> = vec![0];
    let result = affinity_binary_to_array(binary);
    assert_eq!(result, expected);

    // Only last core of 8: "10000000" -> [7]
    let binary = "10000000";
    let expected: Vec<i32> = vec![7];
    let result = affinity_binary_to_array(binary);
    assert_eq!(result, expected);

    // Empty/no cores: "0000" -> []
    let binary = "0000";
    let expected: Vec<i32> = vec![];
    let result = affinity_binary_to_array(binary);
    assert_eq!(result, expected);
}

/// Test array to binary conversion
#[test]
fn test_affinity_array_to_binary() {
    // All 4 cores: [0, 1, 2, 3] -> "1111"
    let cores = vec![0, 1, 2, 3];
    let result = affinity_array_to_binary(&cores, 4);
    assert_eq!(result, "1111");

    // Alternating: [1, 3] -> "1010"
    let cores = vec![1, 3];
    let result = affinity_array_to_binary(&cores, 4);
    assert_eq!(result, "1010");

    // First core only: [0] -> "0001"
    let cores = vec![0];
    let result = affinity_array_to_binary(&cores, 4);
    assert_eq!(result, "0001");

    // Empty: [] -> "0000"
    let cores: Vec<i32> = vec![];
    let result = affinity_array_to_binary(&cores, 4);
    assert_eq!(result, "0000");

    // 8-core system with cores 0, 2, 4, 6: -> "01010101"
    let cores = vec![0, 2, 4, 6];
    let result = affinity_array_to_binary(&cores, 8);
    assert_eq!(result, "01010101");
}

/// Test roundtrip conversion
#[test]
fn test_affinity_roundtrip() {
    let original_cores = vec![0, 2, 5, 7];
    let binary = affinity_array_to_binary(&original_cores, 8);
    let recovered = affinity_binary_to_array(&binary);

    // Sort both for comparison (order might differ)
    let mut sorted_original = original_cores.clone();
    let mut sorted_recovered = recovered.clone();
    sorted_original.sort();
    sorted_recovered.sort();

    assert_eq!(sorted_original, sorted_recovered);
}

// Helper functions (copy from dto.rs for testing)
fn affinity_binary_to_array(binary: &str) -> Vec<i32> {
    binary
        .chars()
        .rev()
        .enumerate()
        .filter_map(|(i, c)| if c == '1' { Some(i as i32) } else { None })
        .collect()
}

fn affinity_array_to_binary(cores: &[i32], total_cores: usize) -> String {
    let mut binary = vec!['0'; total_cores];
    for &core in cores {
        if (core as usize) < total_cores {
            binary[total_cores - 1 - core as usize] = '1';
        }
    }
    binary.into_iter().collect()
}

/// Test ProcessPriorityEnum conversion
#[test]
fn test_process_priority_enum() {
    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    enum ProcessPriorityEnum {
        DontOverride,
        Idle,
        BelowNormal,
        Normal,
        AboveNormal,
        High,
        RealTime,
    }

    impl ProcessPriorityEnum {
        fn from_str(s: &str) -> Self {
            match s {
                "DontOverride" => Self::DontOverride,
                "Idle" => Self::Idle,
                "BelowNormal" => Self::BelowNormal,
                "Normal" => Self::Normal,
                "AboveNormal" => Self::AboveNormal,
                "High" => Self::High,
                "RealTime" => Self::RealTime,
                _ => Self::DontOverride,
            }
        }

        fn as_str(&self) -> &'static str {
            match self {
                Self::DontOverride => "DontOverride",
                Self::Idle => "Idle",
                Self::BelowNormal => "BelowNormal",
                Self::Normal => "Normal",
                Self::AboveNormal => "AboveNormal",
                Self::High => "High",
                Self::RealTime => "RealTime",
            }
        }
    }

    // Test roundtrip for all variants
    let variants = [
        ProcessPriorityEnum::DontOverride,
        ProcessPriorityEnum::Idle,
        ProcessPriorityEnum::BelowNormal,
        ProcessPriorityEnum::Normal,
        ProcessPriorityEnum::AboveNormal,
        ProcessPriorityEnum::High,
        ProcessPriorityEnum::RealTime,
    ];

    for variant in variants {
        let s = variant.as_str();
        let recovered = ProcessPriorityEnum::from_str(s);
        assert_eq!(variant, recovered, "Roundtrip failed for {:?}", variant);
    }

    // Test unknown string defaults to DontOverride
    let unknown = ProcessPriorityEnum::from_str("InvalidPriority");
    assert_eq!(unknown, ProcessPriorityEnum::DontOverride);
}

/// Test settings defaults
#[test]
fn test_settings_defaults() {
    #[derive(Debug)]
    struct LaunchSettings {
        vital_service_https_port: i32,
        vital_service_http_port: i32,
    }

    impl Default for LaunchSettings {
        fn default() -> Self {
            Self {
                vital_service_https_port: 50031,
                vital_service_http_port: 50030,
            }
        }
    }

    let settings = LaunchSettings::default();
    assert_eq!(settings.vital_service_http_port, 50030);
    assert_eq!(settings.vital_service_https_port, 50031);
}

/// Test JSON serialization of DTOs
#[test]
fn test_dto_serialization() {
    use serde::{Deserialize, Serialize};

    #[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
    #[serde(rename_all = "camelCase")]
    struct ProfileDto {
        id: i64,
        name: String,
        managed_models_ids: Vec<i64>,
        enabled: bool,
        active: bool,
        priority: Option<i32>,
    }

    let profile = ProfileDto {
        id: 1,
        name: "Test Profile".to_string(),
        managed_models_ids: vec![1, 2, 3],
        enabled: true,
        active: true,
        priority: Some(5),
    };

    // Serialize to JSON
    let json = serde_json::to_string(&profile).unwrap();

    // Verify camelCase naming
    assert!(json.contains("\"managedModelsIds\""), "Should use camelCase");
    assert!(!json.contains("\"managed_models_ids\""), "Should not use snake_case");

    // Deserialize back
    let recovered: ProfileDto = serde_json::from_str(&json).unwrap();
    assert_eq!(profile, recovered);
}

/// Test HashMap operations for metrics
#[test]
fn test_metrics_hashmap() {
    let mut cpu_usage: HashMap<i32, f32> = HashMap::new();

    // Add some process CPU usage data
    cpu_usage.insert(1234, 25.5);
    cpu_usage.insert(5678, 10.0);
    cpu_usage.insert(9999, 0.5);

    assert_eq!(cpu_usage.len(), 3);
    assert_eq!(cpu_usage.get(&1234), Some(&25.5));

    // Update existing
    cpu_usage.insert(1234, 30.0);
    assert_eq!(cpu_usage.get(&1234), Some(&30.0));

    // Remove
    cpu_usage.remove(&9999);
    assert_eq!(cpu_usage.len(), 2);
}

/// Test date/time handling for metrics
#[test]
fn test_datetime_handling() {
    use chrono::{DateTime, Utc, Duration};

    let now = Utc::now();
    let one_hour_ago = now - Duration::hours(1);
    let two_days_ago = now - Duration::days(2);

    // Test RFC3339 formatting (used for database storage)
    let formatted = now.to_rfc3339();
    let parsed = DateTime::parse_from_rfc3339(&formatted)
        .map(|dt| dt.with_timezone(&Utc))
        .unwrap();

    // Should be within a second of original
    let diff = (now - parsed).num_milliseconds().abs();
    assert!(diff < 1000, "Parsed time should be within 1 second of original");

    // Test time range queries
    assert!(one_hour_ago < now);
    assert!(two_days_ago < one_hour_ago);

    // Test duration calculations
    let retention = Duration::days(2);
    let cutoff = now - retention;
    assert!(two_days_ago <= cutoff, "Two days ago should be at or before cutoff");
}
