# GpuUsage

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**name** | Option<**String**> |  | [optional]
**temperature_readings** | **::std::collections::HashMap<String, f32>** |  | 
**device_index** | **i32** |  | 
**part_number** | Option<**String**> |  | [optional]
**total_memory_bytes** | Option<**i64**> |  | [optional]
**memory_used_bytes** | Option<**i64**> |  | [optional]
**clock_speeds** | Option<[**crate::models::GpuClockSpeeds**](GpuClockSpeeds.md)> |  | [optional]
**fan_percentage** | Option<**::std::collections::HashMap<String, f32>**> |  | [optional]
**power_draw_watt** | Option<**i32**> |  | [optional]
**load** | Option<[**crate::models::LoadData**](LoadData.md)> |  | [optional]
**pc_ie** | Option<[**crate::models::PcieThroughPut**](PCIE_ThroughPut.md)> |  | [optional]

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


