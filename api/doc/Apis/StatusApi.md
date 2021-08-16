# StatusApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getApiStatus**](StatusApi.md#getApiStatus) | **GET** /status | 
[**getApiStatusHyperledgerMSP**](StatusApi.md#getApiStatusHyperledgerMSP) | **GET** /status/hyperledger/{mspid} | 
[**getStatusMSP**](StatusApi.md#getStatusMSP) | **GET** /status/offchain/{mspid} | 


<a name="getApiStatus"></a>
# **getApiStatus**
> Object getApiStatus()



    Show version information of the API

### Parameters
This endpoint does not need any parameter.

### Return type

[**Object**](../Models/object.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

<a name="getApiStatusHyperledgerMSP"></a>
# **getApiStatusHyperledgerMSP**
> Object getApiStatusHyperledgerMSP(mspid)



    Show hyperledger status information of an MSP

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **mspid** | **String**| Name of a MSP | [default to null]

### Return type

[**Object**](../Models/object.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

<a name="getStatusMSP"></a>
# **getStatusMSP**
> Object getStatusMSP(mspid)



    Show status information of an MSP

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **mspid** | **String**| Name of a MSP | [default to null]

### Return type

[**Object**](../Models/object.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

