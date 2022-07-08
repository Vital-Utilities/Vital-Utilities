# DiskUsageMetricModel

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **i32** |  | 
**unique_identifier** | Option<**String**> |  | 
**serial** | Option<**String**> |  | 
**name** | Option<**String**> |  | 
**drive_letter** | Option<**String**> |  | 
**drive_type** | [**crate::models::DriveType**](DriveType.md) |  | 
**used_space_percentage** | Option<**f32**> |  | 
**used_space_bytes** | Option<**i64**> |  | 
**write_activity_percentage** | Option<**f32**> |  | 
**total_activity_percentage** | Option<**f32**> |  | 
**read_rate_bytes_per_second** | Option<**f64**> |  | 
**write_rate_bytes_per_second** | Option<**f64**> |  | 
**data_read_bytes** | Option<**f64**> |  | 
**data_written_bytes** | Option<**f64**> |  | 
**temperatures** | Option<**::std::collections::HashMap<String, f32>**> |  | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


