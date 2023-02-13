# GetMachineDynamicDataResponse

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**cpu_usage_data** | Option<[**crate::models::CpuUsage**](CpuUsage.md)> |  | [optional]
**ram_usages_data** | Option<[**crate::models::MemoryUsage**](MemoryUsage.md)> |  | [optional]
**gpu_usage_data** | Option<[**Vec<crate::models::GpuUsage>**](GpuUsage.md)> |  | [optional]
**disk_usages** | Option<[**crate::models::DiskUsages**](DiskUsages.md)> |  | [optional]
**network_usage_data** | Option<[**crate::models::NetworkAdapterUsages**](NetworkAdapterUsages.md)> |  | [optional]
**process_cpu_usage** | Option<**::std::collections::HashMap<String, f32>**> |  | [optional]
**process_cpu_threads_usage** | Option<**::std::collections::HashMap<String, f32>**> |  | [optional]
**process_thread_count** | Option<**::std::collections::HashMap<String, f32>**> |  | [optional]
**process_ram_usage_bytes** | Option<**::std::collections::HashMap<String, f32>**> |  | [optional]
**process_disk_bytes_per_sec_activity** | Option<**::std::collections::HashMap<String, f64>**> |  | [optional]
**cpu_temperature** | Option<**::std::collections::HashMap<String, f32>**> |  | [optional]
**process_gpu_usage** | Option<**::std::collections::HashMap<String, f32>**> |  | [optional]

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


