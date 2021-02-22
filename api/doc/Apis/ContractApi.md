# ContractApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**deletePrivateDocument**](ContractApi.md#deletePrivateDocument) | **DELETE** /private-documents/{referenceID} | 
[**fetchPrivateDocument**](ContractApi.md#fetchPrivateDocument) | **GET** /private-documents/{referenceID} | 
[**fetchPrivateDocumentReferenceIDs**](ContractApi.md#fetchPrivateDocumentReferenceIDs) | **GET** /private-documents | 
[**fetchSignatures**](ContractApi.md#fetchSignatures) | **GET** /signatures/{referenceID}/{signer} | 
[**uploadPrivateDocument**](ContractApi.md#uploadPrivateDocument) | **POST** /private-documents | 
[**uploadSignature**](ContractApi.md#uploadSignature) | **PUT** /signatures/{referenceID} | 
[**verifySignatures**](ContractApi.md#verifySignatures) | **GET** /signatures/{referenceID}/verify/{creator}/{signer} | 


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
> String fetchSignatures(referenceID, signer)



    Fetch all signatures for a given referenceID and a signer from the ledger

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **referenceID** | **String**| The referenceID of the document | [default to null]
 **signer** | **String**| The signers MSP name | [default to null]

### Return type

[**String**](../Models/string.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: text/plain, application/json

<a name="uploadPrivateDocument"></a>
# **uploadPrivateDocument**
> PrivateDocumentResponse uploadPrivateDocument(body)



    Upload a private document, shared between our own organization and a partner MSP

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **body** | [**PrivateDocument**](../Models/PrivateDocument.md)| A document that should be uploaded |

### Return type

[**PrivateDocumentResponse**](../Models/PrivateDocumentResponse.md)

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
> String verifySignatures(referenceID, creator, signer)



    Fetch all signatures for a given reference id, creator and signer from the ledger and verify the content against the on chain referencepayload link

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **referenceID** | **String**| The referenceID | [default to null]
 **creator** | **String**| The initial creator of the contract that was signed. This also verifies the origin on chain. | [default to null]
 **signer** | **String**| The signer | [default to null]

### Return type

[**String**](../Models/string.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: text/plain, application/json

