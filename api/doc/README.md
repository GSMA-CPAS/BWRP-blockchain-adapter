# Documentation for Blockchain-Adapter

<a name="documentation-for-api-endpoints"></a>
## Documentation for API Endpoints

All URIs are relative to *http://localhost*

Class | Method | HTTP request | Description
------------ | ------------- | ------------- | -------------
*ConfigApi* | [**setOffchainDBAdapterConfig**](Apis/ConfigApi.md#setoffchaindbadapterconfig) | **PUT** /config/offchain-db-adapter | Update the configuration of the offchain-db-adapter
*ContractApi* | [**fetchPrivateDocument**](Apis/ContractApi.md#fetchprivatedocument) | **GET** /private-documents/{hash} | Fetch a private document from the database
*ContractApi* | [**fetchSignatures**](Apis/ContractApi.md#fetchsignatures) | **GET** /signatures/{hash}/{msp} | fetch all signatures for a given msp and a given document hash from the ledger
*ContractApi* | [**signaturesSubscribePost**](Apis/ContractApi.md#signaturessubscribepost) | **POST** /signatures/subscribe | subscribes a client to receive new signature events
*ContractApi* | [**uploadPrivateDocument**](Apis/ContractApi.md#uploadprivatedocument) | **POST** /private-documents | Upload a private document, shared between our own organization and a partner MSP
*ContractApi* | [**uploadSignature**](Apis/ContractApi.md#uploadsignature) | **PUT** /signatures/{hash} | store a signature for the document identified by hash on the ledger


<a name="documentation-for-models"></a>
## Documentation for Models

 - [DocumentSignature](./Models/DocumentSignature.md)
 - [InlineObject](./Models/InlineObject.md)
 - [OffchainDBAdapterConfig](./Models/OffchainDBAdapterConfig.md)
 - [PrivateDocument](./Models/PrivateDocument.md)
 - [PrivateDocumentResponse](./Models/PrivateDocumentResponse.md)


<a name="documentation-for-authorization"></a>
## Documentation for Authorization

All endpoints do not require authorization.
