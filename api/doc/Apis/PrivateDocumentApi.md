# PrivateDocumentApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**fetchPrivateDocument**](PrivateDocumentApi.md#fetchPrivateDocument) | **GET** /private-documents/{hash} | 
[**uploadPrivateDocument**](PrivateDocumentApi.md#uploadPrivateDocument) | **POST** /private-documents | 


<a name="fetchPrivateDocument"></a>
# **fetchPrivateDocument**
> PrivateDocument fetchPrivateDocument(hash)



    Fetch a private document from the database

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **hash** | **String**| The document hash | [default to null]

### Return type

[**PrivateDocument**](../Models/PrivateDocument.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

<a name="uploadPrivateDocument"></a>
# **uploadPrivateDocument**
> String uploadPrivateDocument(body)



    Upload a private document

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **body** | [**PrivateDocument**](../Models/PrivateDocument.md)| A document that should be uploaded |

### Return type

[**String**](../Models/string.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: text/plain

