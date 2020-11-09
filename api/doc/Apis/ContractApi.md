# ContractApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**deletePrivateDocument**](ContractApi.md#deletePrivateDocument) | **DELETE** /private-documents/{id} | 
[**fetchPrivateDocument**](ContractApi.md#fetchPrivateDocument) | **GET** /private-documents/{id} | 
[**fetchPrivateDocuments**](ContractApi.md#fetchPrivateDocuments) | **GET** /private-documents | 
[**fetchSignatures**](ContractApi.md#fetchSignatures) | **GET** /signatures/{id}/{msp} | 
[**uploadPrivateDocument**](ContractApi.md#uploadPrivateDocument) | **POST** /private-documents | 
[**uploadSignature**](ContractApi.md#uploadSignature) | **PUT** /signatures/{id} | 


<a name="deletePrivateDocument"></a>
# **deletePrivateDocument**
> deletePrivateDocument(id)



    Delete a private document from the database, identified by its id

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**| The document ID | [default to null]

### Return type

null (empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined

<a name="fetchPrivateDocument"></a>
# **fetchPrivateDocument**
> PrivateDocumentResponse fetchPrivateDocument(id)



    Fetch a private document from the database, identified by its id

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**| The document ID | [default to null]

### Return type

[**PrivateDocumentResponse**](../Models/PrivateDocumentResponse.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

<a name="fetchPrivateDocuments"></a>
# **fetchPrivateDocuments**
> Map fetchPrivateDocuments()



    show last n private documents

### Parameters
This endpoint does not need any parameter.

### Return type

[**Map**](../Models/PrivateDocument.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

<a name="fetchSignatures"></a>
# **fetchSignatures**
> String fetchSignatures(id, msp)



    Fetch all signatures for a given msp and a given document id from the ledger

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**| The document ID | [default to null]
 **msp** | **String**| A MSP name | [default to null]

### Return type

[**String**](../Models/string.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: text/plain

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
> String uploadSignature(id, body)



    store a signature for the document identified by id on the ledger

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**| The document ID | [default to null]
 **body** | [**DocumentSignature**](../Models/DocumentSignature.md)| a document signature that should be uploaded |

### Return type

[**String**](../Models/string.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: text/plain

