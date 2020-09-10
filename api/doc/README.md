# Documentation for Blockchain-Adapter

<a name="documentation-for-api-endpoints"></a>
## Documentation for API Endpoints

All URIs are relative to *http://localhost*

Class | Method | HTTP request | Description
------------ | ------------- | ------------- | -------------
*DefaultApi* | [**signaturesSubscribePost**](Apis/DefaultApi.md#signaturessubscribepost) | **POST** /signatures/subscribe | subscribes a client to receive new signature events
*FetchSignaturesApi* | [**fetchSignatures**](Apis/FetchSignaturesApi.md#fetchsignatures) | **GET** /signatures/{hash}/{msp} | fetch all signatures for a given msp and a given document hash from the ledger
*OffchainDbAdapterConfigApi* | [**setOffchainDBAdapterConfig**](Apis/OffchainDbAdapterConfigApi.md#setoffchaindbadapterconfig) | **PUT** /config/offchain-db-adapter | Update the configuration of the offchain-db-adapter
*PrivateDocumentApi* | [**fetchPrivateDocument**](Apis/PrivateDocumentApi.md#fetchprivatedocument) | **GET** /private-documents/{hash} | Fetch a private document from the database
*PrivateDocumentApi* | [**uploadPrivateDocument**](Apis/PrivateDocumentApi.md#uploadprivatedocument) | **POST** /private-documents | Upload a private document
*UploadSignatureApi* | [**uploadSignature**](Apis/UploadSignatureApi.md#uploadsignature) | **POST** /signatures | store a signature for a given document on the ledger


<a name="documentation-for-models"></a>
## Documentation for Models

 - [DocumentSignature](./Models/DocumentSignature.md)
 - [InlineObject](./Models/InlineObject.md)
 - [OffchainDBAdapterConfig](./Models/OffchainDBAdapterConfig.md)
 - [PrivateDocument](./Models/PrivateDocument.md)


<a name="documentation-for-authorization"></a>
## Documentation for Authorization

All endpoints do not require authorization.
