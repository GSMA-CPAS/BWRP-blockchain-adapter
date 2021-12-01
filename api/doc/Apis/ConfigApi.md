# ConfigApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getOffchainDBConfig**](ConfigApi.md#getOffchainDBConfig) | **GET** /config/offchain-db | 
[**setOffchainDBConfig**](ConfigApi.md#setOffchainDBConfig) | **PUT** /config/offchain-db | 


<a name="getOffchainDBConfig"></a>
# **getOffchainDBConfig**
> OffchainDBConfig getOffchainDBConfig()



    Read back the configuration of the offchain-db

### Parameters
This endpoint does not need any parameter.

### Return type

[**OffchainDBConfig**](../Models/OffchainDBConfig.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

<a name="setOffchainDBConfig"></a>
# **setOffchainDBConfig**
> String setOffchainDBConfig(body)



    Update the configuration of the offchain-db

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **body** | [**OffchainDBConfig**](../Models/OffchainDBConfig.md)| A configuration for the offchain-db |

### Return type

[**String**](../Models/string.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: text/plain, application/json

