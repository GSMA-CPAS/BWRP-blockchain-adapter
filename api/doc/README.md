# Documentation for Blockchain-Adapter

<a name="documentation-for-api-endpoints"></a>
## Documentation for API Endpoints

All URIs are relative to *http://localhost*

Class | Method | HTTP request | Description
------------ | ------------- | ------------- | -------------
*ConfigApi* | [**getOffchainDBConfig**](Apis/ConfigApi.md#getoffchaindbconfig) | **GET** /config/offchain-db | Read back the configuration of the offchain-db
*ConfigApi* | [**setCertificateRoot**](Apis/ConfigApi.md#setcertificateroot) | **PUT** /config/certificates/root | Upload a root certificate
*ConfigApi* | [**setOffchainDBConfig**](Apis/ConfigApi.md#setoffchaindbconfig) | **PUT** /config/offchain-db | Update the configuration of the offchain-db
*ContractApi* | [**deletePrivateDocument**](Apis/ContractApi.md#deleteprivatedocument) | **DELETE** /private-documents/{referenceID} | Delete a private document from the database, identified by its referenceID
*ContractApi* | [**fetchPrivateDocument**](Apis/ContractApi.md#fetchprivatedocument) | **GET** /private-documents/{referenceID} | Fetch a private document from the database, identified by its referenceID
*ContractApi* | [**fetchPrivateDocumentReferenceIDs**](Apis/ContractApi.md#fetchprivatedocumentreferenceids) | **GET** /private-documents | show all private documents that are in the transient storage
*ContractApi* | [**fetchSignatures**](Apis/ContractApi.md#fetchsignatures) | **GET** /signatures/{referenceID}/{signerMSP} | Fetch all signatures for a given referenceID and a signerMSP from the ledger
*ContractApi* | [**getReferencePayloadLink**](Apis/ContractApi.md#getreferencepayloadlink) | **GET** /payloadlink/{referenceID}/{creatorMSPID} | Fetch the stored referencepayloadlink for a given reference id and creator
*ContractApi* | [**uploadPrivateDocument**](Apis/ContractApi.md#uploadprivatedocument) | **POST** /private-documents | Upload a private document, shared between our own organization and a partner MSP
*ContractApi* | [**uploadSignature**](Apis/ContractApi.md#uploadsignature) | **PUT** /signatures/{referenceID} | store a signature for the document identified by its referenceID on the ledger
*ContractApi* | [**verifySignatures**](Apis/ContractApi.md#verifysignatures) | **GET** /signatures/{referenceID}/verify/{creator}/{signer} | Fetch all signatures for a given reference id, creator and signer from the ledger and verify the content against the on chain referencepayload link
*DiscoveryApi* | [**getDiscoveryMSP**](Apis/DiscoveryApi.md#getdiscoverymsp) | **GET** /discovery/msps/{mspid} | Show details for a specific MSP
*DiscoveryApi* | [**getDiscoveryMSPs**](Apis/DiscoveryApi.md#getdiscoverymsps) | **GET** /discovery/msps | Show a list of all MSPs
*StatusApi* | [**getApiStatus**](Apis/StatusApi.md#getapistatus) | **GET** /status | Show version information of the API
*WebhookApi* | [**webhooksGet**](Apis/WebhookApi.md#webhooksget) | **GET** /webhooks | show all subscriptions
*WebhookApi* | [**webhooksSubscribePost**](Apis/WebhookApi.md#webhookssubscribepost) | **POST** /webhooks/subscribe | subscribes a client to receive the specified event
*WebhookApi* | [**webhooksSubscriptionIDDelete**](Apis/WebhookApi.md#webhookssubscriptioniddelete) | **DELETE** /webhooks/{subscriptionID} | unsubscribes a client from the specified event


<a name="documentation-for-models"></a>
## Documentation for Models

 - [BlockchainRef](./Models/BlockchainRef.md)
 - [DocumentSignature](./Models/DocumentSignature.md)
 - [ErrorCode](./Models/ErrorCode.md)
 - [OffchainDBConfig](./Models/OffchainDBConfig.md)
 - [PrivateDocument](./Models/PrivateDocument.md)
 - [PrivateDocumentResponse](./Models/PrivateDocumentResponse.md)
 - [SubscriptionPayload](./Models/SubscriptionPayload.md)
 - [SubscriptionRequest](./Models/SubscriptionRequest.md)


<a name="documentation-for-authorization"></a>
## Documentation for Authorization

All endpoints do not require authorization.
