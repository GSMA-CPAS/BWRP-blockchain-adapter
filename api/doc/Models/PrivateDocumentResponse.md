# PrivateDocumentResponse
## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**FromMSP** | [**String**](string.md) | The MSP that creates this document | [default to null]
**ToMSP** | [**String**](string.md) | The partner MSP that is also involved | [default to null]
**SenderID** | [**String**](string.md) | The hyperledger senderID of the TX | [default to null]
**Data** | [**String**](string.md) | A base64 encoded document | [default to null]
**DataHash** | [**String**](string.md) | The hash over the document | [default to null]
**Timestamp** | [**String**](string.md) | The timestamp when the document was stored in the local database. | [default to null]
**ID** | [**Integer**](integer.md) | The internal ID from mySQL (not really necessary, to be removed) | [default to null]

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)

