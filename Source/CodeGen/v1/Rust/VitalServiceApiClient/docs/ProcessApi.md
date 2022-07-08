# \ProcessApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**api_process_get**](ProcessApi.md#api_process_get) | **GET** /api/Process | 
[**api_process_kill_id_post**](ProcessApi.md#api_process_kill_id_post) | **POST** /api/Process/kill/{id} | 
[**api_process_managed_get**](ProcessApi.md#api_process_managed_get) | **GET** /api/Process/Managed | 
[**api_process_openpath_id_post**](ProcessApi.md#api_process_openpath_id_post) | **POST** /api/Process/openpath/{id} | 
[**api_process_openproperties_id_post**](ProcessApi.md#api_process_openproperties_id_post) | **POST** /api/Process/openproperties/{id} | 
[**api_process_processes_to_add_get**](ProcessApi.md#api_process_processes_to_add_get) | **GET** /api/Process/ProcessesToAdd | 
[**api_process_running_processes_get**](ProcessApi.md#api_process_running_processes_get) | **GET** /api/Process/RunningProcesses | 



## api_process_get

> crate::models::GetAllResponse api_process_get()


### Parameters

This endpoint does not need any parameter.

### Return type

[**crate::models::GetAllResponse**](GetAllResponse.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: text/plain, application/json, text/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## api_process_kill_id_post

> api_process_kill_id_post(id)


### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**id** | **i32** |  | [required] |

### Return type

 (empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## api_process_managed_get

> crate::models::GetManagedResponse api_process_managed_get()


### Parameters

This endpoint does not need any parameter.

### Return type

[**crate::models::GetManagedResponse**](GetManagedResponse.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: text/plain, application/json, text/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## api_process_openpath_id_post

> api_process_openpath_id_post(id)


### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**id** | **i32** |  | [required] |

### Return type

 (empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## api_process_openproperties_id_post

> api_process_openproperties_id_post(id)


### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**id** | **i32** |  | [required] |

### Return type

 (empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## api_process_processes_to_add_get

> crate::models::GetProcessesToAddResponse api_process_processes_to_add_get()


### Parameters

This endpoint does not need any parameter.

### Return type

[**crate::models::GetProcessesToAddResponse**](GetProcessesToAddResponse.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: text/plain, application/json, text/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## api_process_running_processes_get

> crate::models::GetRunningProcessesResponse api_process_running_processes_get()


### Parameters

This endpoint does not need any parameter.

### Return type

[**crate::models::GetRunningProcessesResponse**](GetRunningProcessesResponse.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: text/plain, application/json, text/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

