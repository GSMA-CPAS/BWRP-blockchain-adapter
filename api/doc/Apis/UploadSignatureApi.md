# UploadSignatureApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**uploadSignature**](UploadSignatureApi.md#uploadSignature) | **POST** /signatures | 


<a name="uploadSignature"></a>
# **uploadSignature**
> String uploadSignature(DocumentSignature)



    store a signature for a given document on the ledger

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **DocumentSignature** | [**DocumentSignature**](../Models/DocumentSignature.md)| a document signature that should be uploaded |

### Return type

[**String**](../Models/string.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: text/plain

