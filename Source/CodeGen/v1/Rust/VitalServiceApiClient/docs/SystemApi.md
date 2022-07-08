# \SystemApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**api_system_dynamic_get**](SystemApi.md#api_system_dynamic_get) | **GET** /api/System/dynamic | 
[**api_system_patch**](SystemApi.md#api_system_patch) | **PATCH** /api/System | 
[**api_system_static_get**](SystemApi.md#api_system_static_get) | **GET** /api/System/static | 
[**api_system_timeseries_post**](SystemApi.md#api_system_timeseries_post) | **POST** /api/System/timeseries | 



## api_system_dynamic_get

> crate::models::GetMachineDynamicDataResponse api_system_dynamic_get()


### Parameters

This endpoint does not need any parameter.

### Return type

[**crate::models::GetMachineDynamicDataResponse**](GetMachineDynamicDataResponse.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: text/plain, application/json, text/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## api_system_patch

> api_system_patch()


### Parameters

This endpoint does not need any parameter.

### Return type

 (empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## api_system_static_get

> crate::models::GetMachineStaticDataResponse api_system_static_get()


### Parameters

This endpoint does not need any parameter.

### Return type

[**crate::models::GetMachineStaticDataResponse**](GetMachineStaticDataResponse.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: text/plain, application/json, text/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## api_system_timeseries_post

> crate::models::TimeSeriesMachineMetricsResponse api_system_timeseries_post(get_machine_time_series_request)


### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**get_machine_time_series_request** | Option<[**GetMachineTimeSeriesRequest**](GetMachineTimeSeriesRequest.md)> |  |  |

### Return type

[**crate::models::TimeSeriesMachineMetricsResponse**](TimeSeriesMachineMetricsResponse.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json, text/json, application/*+json
- **Accept**: text/plain, application/json, text/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

