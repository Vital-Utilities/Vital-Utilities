# GetMachineDynamicDataResponse

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**cpu_usage_data** | [**crate::models::CpuUsage**](CpuUsage.md) |  | 
**ram_usages_data** | [**crate::models::MemoryUsage**](MemoryUsage.md) |  | 
**gpu_usage_data** | Option<[**Vec<crate::models::GpuUsages>**](GpuUsages.md)> |  | 
**disk_usages** | [**crate::models::DiskUsages**](DiskUsages.md) |  | 
**network_usage_data** | [**crate::models::NetworkAdapterUsages**](NetworkAdapterUsages.md) |  | 
**process_cpu_usage** | Option<**::std::collections::HashMap<String, f32>**> |  | 
**process_cpu_threads_usage** | Option<**::std::collections::HashMap<String, f32>**> |  | 
**process_thread_count** | Option<**::std::collections::HashMap<String, f32>**> |  | 
**process_ram_usage_gb** | Option<**::std::collections::HashMap<String, f32>**> |  | 
**process_disk_bytes_per_sec_activity** | Option<**::std::collections::HashMap<String, f64>**> |  | 
**cpu_temperature** | Option<**::std::collections::HashMap<String, f32>**> |  | 
**process_gpu_usage** | Option<**::std::collections::HashMap<String, f32>**> |  | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


