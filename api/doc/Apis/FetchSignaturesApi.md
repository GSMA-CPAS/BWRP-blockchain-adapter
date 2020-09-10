# FetchSignaturesApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**fetchSignatures**](FetchSignaturesApi.md#fetchSignatures) | **GET** /signatures/{hash}/{msp} | 


<a name="fetchSignatures"></a>
# **fetchSignatures**
> String fetchSignatures(hash, msp)



    fetch all signatures for a given msp and a given document hash from the ledger

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **hash** | **String**| The document hash | [default to null]
 **msp** | **String**| A MSP name | [default to null]

### Return type

[**String**](../Models/string.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: text/plain

