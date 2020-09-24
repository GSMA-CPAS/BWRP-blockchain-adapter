# ConfigApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getOffchainDBAdapterConfig**](ConfigApi.md#getOffchainDBAdapterConfig) | **GET** /config/offchain-db-adapter | 
[**setOffchainDBAdapterConfig**](ConfigApi.md#setOffchainDBAdapterConfig) | **PUT** /config/offchain-db-adapter | 


<a name="getOffchainDBAdapterConfig"></a>
# **getOffchainDBAdapterConfig**
> OffchainDBAdapterConfig getOffchainDBAdapterConfig()



    Read back the configuration of the offchain-db-adapter

### Parameters
This endpoint does not need any parameter.

### Return type

[**OffchainDBAdapterConfig**](../Models/OffchainDBAdapterConfig.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

<a name="setOffchainDBAdapterConfig"></a>
# **setOffchainDBAdapterConfig**
> String setOffchainDBAdapterConfig(body)



    Update the configuration of the offchain-db-adapter

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **body** | [**OffchainDBAdapterConfig**](../Models/OffchainDBAdapterConfig.md)| A configuration for the offchain-db-adapter |

### Return type

[**String**](../Models/string.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: text/plain

