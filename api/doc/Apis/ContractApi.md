# ContractApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**deletePrivateDocument**](ContractApi.md#deletePrivateDocument) | **DELETE** /private-documents/{referenceID} | 
[**fetchPrivateDocument**](ContractApi.md#fetchPrivateDocument) | **GET** /private-documents/{referenceID} | 
[**fetchPrivateDocumentReferenceIDs**](ContractApi.md#fetchPrivateDocumentReferenceIDs) | **GET** /private-documents | 
[**fetchSignatures**](ContractApi.md#fetchSignatures) | **GET** /signatures/{referenceID}/{msp} | 
[**uploadPrivateDocument**](ContractApi.md#uploadPrivateDocument) | **POST** /private-documents | 
[**uploadSignature**](ContractApi.md#uploadSignature) | **PUT** /signatures/{referenceID} | 
[**verifySignatures**](ContractApi.md#verifySignatures) | **PUT** /signatures/{id}/{msp}/verify | 


<a name="deletePrivateDocument"></a>
# **deletePrivateDocument**
> deletePrivateDocument(referenceID)



    Delete a private document from the database, identified by its referenceID

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **referenceID** | **String**| The referenceID for the document to delete | [default to null]

### Return type

null (empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

<a name="fetchPrivateDocument"></a>
# **fetchPrivateDocument**
> PrivateDocumentResponse fetchPrivateDocument(referenceID)



    Fetch a private document from the database, identified by its referenceID

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **referenceID** | **String**| The referenceID of the document | [default to null]

### Return type

[**PrivateDocumentResponse**](../Models/PrivateDocumentResponse.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

<a name="fetchPrivateDocumentReferenceIDs"></a>
# **fetchPrivateDocumentReferenceIDs**
> List fetchPrivateDocumentReferenceIDs()



    show all private documents that are in the transient storage

### Parameters
This endpoint does not need any parameter.

### Return type

[**List**](../Models/string.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

<a name="fetchSignatures"></a>
# **fetchSignatures**
> String fetchSignatures(referenceID, msp)



    Fetch all signatures for a given msp and a given referenceID from the ledger

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **referenceID** | **String**| The referenceID of the document | [default to null]
 **msp** | **String**| A MSP name | [default to null]

### Return type

[**String**](../Models/string.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: text/plain, application/json

<a name="uploadPrivateDocument"></a>
# **uploadPrivateDocument**
> PrivateDocumentAdded uploadPrivateDocument(body)



    Upload a private document, shared between our own organization and a partner MSP

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **body** | [**PrivateDocument**](../Models/PrivateDocument.md)| A document that should be uploaded |

### Return type

[**PrivateDocumentAdded**](../Models/PrivateDocumentAdded.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json

<a name="uploadSignature"></a>
# **uploadSignature**
> String uploadSignature(referenceID, body)



    store a signature for the document identified by its referenceID on the ledger

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **referenceID** | **String**| The referenceID of the document | [default to null]
 **body** | [**DocumentSignature**](../Models/DocumentSignature.md)| a document signature that should be uploaded |

### Return type

[**String**](../Models/string.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: text/plain, application/json

<a name="verifySignatures"></a>
# **verifySignatures**
> String verifySignatures(id, msp, string)



    Fetch all signatures for a given msp and a given document id from the ledger and verify the content against a given document

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**| The document ID | [default to null]
 **msp** | **String**| A MSP name | [default to null]
 **string** | [**List**](../Models/string.md)| A document to be used to verify the signatures |

### Return type

[**String**](../Models/string.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: text/plain, application/json

