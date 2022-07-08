# \SettingsApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**api_settings_dont_use_get**](SettingsApi.md#api_settings_dont_use_get) | **GET** /api/Settings/DontUse | 
[**api_settings_get**](SettingsApi.md#api_settings_get) | **GET** /api/Settings | 
[**api_settings_set_run_at_startup_put**](SettingsApi.md#api_settings_set_run_at_startup_put) | **PUT** /api/Settings/SetRunAtStartup | 



## api_settings_dont_use_get

> crate::models::ClientSettings api_settings_dont_use_get()


### Parameters

This endpoint does not need any parameter.

### Return type

[**crate::models::ClientSettings**](ClientSettings.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: text/plain, application/json, text/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## api_settings_get

> crate::models::SettingsDto api_settings_get()


### Parameters

This endpoint does not need any parameter.

### Return type

[**crate::models::SettingsDto**](SettingsDto.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: text/plain, application/json, text/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## api_settings_set_run_at_startup_put

> api_settings_set_run_at_startup_put(run_at_startup)


### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**run_at_startup** | Option<**bool**> |  |  |

### Return type

 (empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

