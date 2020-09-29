# Documentation for Blockchain-Adapter

<a name="documentation-for-api-endpoints"></a>
## Documentation for API Endpoints

All URIs are relative to *http://localhost*

Class | Method | HTTP request | Description
------------ | ------------- | ------------- | -------------
*ConfigApi* | [**getOffchainDBAdapterConfig**](Apis/ConfigApi.md#getoffchaindbadapterconfig) | **GET** /config/offchain-db-adapter | Read back the configuration of the offchain-db-adapter
*ConfigApi* | [**setOffchainDBAdapterConfig**](Apis/ConfigApi.md#setoffchaindbadapterconfig) | **PUT** /config/offchain-db-adapter | Update the configuration of the offchain-db-adapter
*ContractApi* | [**fetchPrivateDocument**](Apis/ContractApi.md#fetchprivatedocument) | **GET** /private-documents/{id} | Fetch a private document from the database, identified by its id
*ContractApi* | [**fetchPrivateDocuments**](Apis/ContractApi.md#fetchprivatedocuments) | **GET** /private-documents | show last n private documents
*ContractApi* | [**fetchSignatures**](Apis/ContractApi.md#fetchsignatures) | **GET** /signatures/{id}/{msp} | Fetch all signatures for a given msp and a given document id from the ledger
*ContractApi* | [**uploadPrivateDocument**](Apis/ContractApi.md#uploadprivatedocument) | **POST** /private-documents | Upload a private document, shared between our own organization and a partner MSP
*ContractApi* | [**uploadSignature**](Apis/ContractApi.md#uploadsignature) | **PUT** /signatures/{id} | store a signature for the document identified by id on the ledger
*DiscoveryApi* | [**getDiscoveryMSP**](Apis/DiscoveryApi.md#getdiscoverymsp) | **GET** /discovery/msps/{mspid} | Show details for a specific MSP
*DiscoveryApi* | [**getDiscoveryMSPs**](Apis/DiscoveryApi.md#getdiscoverymsps) | **GET** /discovery/msps | Show a list of all MSPs
*StatusApi* | [**getApiStatus**](Apis/StatusApi.md#getapistatus) | **GET** /status | Show version information of the API
*WebhookApi* | [**webhooksSubscribePost**](Apis/WebhookApi.md#webhookssubscribepost) | **POST** /webhooks/subscribe | subscribes a client to receive the specified event
*WebhookApi* | [**webhooksSubscriptionIDDelete**](Apis/WebhookApi.md#webhookssubscriptioniddelete) | **DELETE** /webhooks/{subscriptionID} | unsubscribes a client from the specified event


<a name="documentation-for-models"></a>
## Documentation for Models

 - [DocumentSignature](./Models/DocumentSignature.md)
 - [OffchainDBAdapterConfig](./Models/OffchainDBAdapterConfig.md)
 - [PrivateDocument](./Models/PrivateDocument.md)
 - [PrivateDocumentResponse](./Models/PrivateDocumentResponse.md)
 - [SubscriptionPayload](./Models/SubscriptionPayload.md)
 - [SubscriptionRequest](./Models/SubscriptionRequest.md)


<a name="documentation-for-authorization"></a>
## Documentation for Authorization

All endpoints do not require authorization.
