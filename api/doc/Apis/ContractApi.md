# ContractApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**fetchPrivateDocument**](ContractApi.md#fetchPrivateDocument) | **GET** /private-documents/{hash} | 
[**fetchSignatures**](ContractApi.md#fetchSignatures) | **GET** /signatures/{hash}/{msp} | 
[**signaturesSubscribePost**](ContractApi.md#signaturesSubscribePost) | **POST** /signatures/subscribe | 
[**uploadPrivateDocument**](ContractApi.md#uploadPrivateDocument) | **POST** /private-documents | 
[**uploadSignature**](ContractApi.md#uploadSignature) | **PUT** /signatures/{hash} | 


<a name="fetchPrivateDocument"></a>
# **fetchPrivateDocument**
> PrivateDocumentResponse fetchPrivateDocument(hash)



    Fetch a private document from the database

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **hash** | **String**| The document hash | [default to null]

### Return type

[**PrivateDocumentResponse**](../Models/PrivateDocumentResponse.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

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

<a name="signaturesSubscribePost"></a>
# **signaturesSubscribePost**
> Object signaturesSubscribePost(callbackUrl)



    subscribes a client to receive new signature events

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **callbackUrl** | **URI**| the location where data will be sent | [default to null]

### Return type

[**Object**](../Models/object.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

<a name="uploadPrivateDocument"></a>
# **uploadPrivateDocument**
> String uploadPrivateDocument(body)



    Upload a private document, shared between our own organization and a partner MSP

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

<a name="uploadSignature"></a>
# **uploadSignature**
> String uploadSignature(hash, body)



    store a signature for the document identified by hash on the ledger

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **hash** | **String**| The document hash | [default to null]
 **body** | [**DocumentSignature**](../Models/DocumentSignature.md)| a document signature that should be uploaded |

### Return type

[**String**](../Models/string.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: text/plain

