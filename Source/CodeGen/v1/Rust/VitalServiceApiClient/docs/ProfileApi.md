# \ProfileApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**api_profile_add_process_config_put**](ProfileApi.md#api_profile_add_process_config_put) | **PUT** /api/Profile/AddProcessConfig | 
[**api_profile_create_put**](ProfileApi.md#api_profile_create_put) | **PUT** /api/Profile/Create | 
[**api_profile_delete_process_config_id_delete**](ProfileApi.md#api_profile_delete_process_config_id_delete) | **DELETE** /api/Profile/DeleteProcessConfig/{id} | 
[**api_profile_get_all_get**](ProfileApi.md#api_profile_get_all_get) | **GET** /api/Profile/GetAll | 
[**api_profile_id_delete**](ProfileApi.md#api_profile_id_delete) | **DELETE** /api/Profile/{id} | 
[**api_profile_id_get**](ProfileApi.md#api_profile_id_get) | **GET** /api/Profile/{id} | 
[**api_profile_update_process_config_put**](ProfileApi.md#api_profile_update_process_config_put) | **PUT** /api/Profile/UpdateProcessConfig | 
[**api_profile_update_put**](ProfileApi.md#api_profile_update_put) | **PUT** /api/Profile/Update | 



## api_profile_add_process_config_put

> api_profile_add_process_config_put(add_proccess_request)


### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**add_proccess_request** | Option<[**AddProccessRequest**](AddProccessRequest.md)> |  |  |

### Return type

 (empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json, text/json, application/*+json
- **Accept**: text/plain, application/json, text/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## api_profile_create_put

> crate::models::ProfileDto api_profile_create_put(create_profile_request)


### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**create_profile_request** | Option<[**CreateProfileRequest**](CreateProfileRequest.md)> |  |  |

### Return type

[**crate::models::ProfileDto**](ProfileDto.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json, text/json, application/*+json
- **Accept**: text/plain, application/json, text/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## api_profile_delete_process_config_id_delete

> api_profile_delete_process_config_id_delete(id)


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
- **Accept**: text/plain, application/json, text/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## api_profile_get_all_get

> Vec<crate::models::ProfileDto> api_profile_get_all_get()


### Parameters

This endpoint does not need any parameter.

### Return type

[**Vec<crate::models::ProfileDto>**](ProfileDto.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: text/plain, application/json, text/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## api_profile_id_delete

> api_profile_id_delete(id)


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
- **Accept**: text/plain, application/json, text/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## api_profile_id_get

> crate::models::ProfileDto api_profile_id_get(id)


### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**id** | **i32** |  | [required] |

### Return type

[**crate::models::ProfileDto**](ProfileDto.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: text/plain, application/json, text/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## api_profile_update_process_config_put

> api_profile_update_process_config_put(update_managed_request)


### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**update_managed_request** | Option<[**UpdateManagedRequest**](UpdateManagedRequest.md)> |  |  |

### Return type

 (empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json, text/json, application/*+json
- **Accept**: text/plain, application/json, text/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## api_profile_update_put

> api_profile_update_put(update_profile_request)


### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**update_profile_request** | Option<[**UpdateProfileRequest**](UpdateProfileRequest.md)> |  |  |

### Return type

 (empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json, text/json, application/*+json
- **Accept**: Not defined

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

