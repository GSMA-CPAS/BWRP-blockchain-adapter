# PrivateDocumentResponse
## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**fromMSP** | [**String**](string.md) | The MSP that creates this document (optional on request) | [default to null]
**senderID** | [**String**](string.md) | The hyperledger senderID of the TX | [default to null]
**dataHash** | [**String**](string.md) | The hash over the document | [default to null]
**timestamp** | [**String**](string.md) | The timestamp when the document was stored in the local database. | [default to null]
**id** | [**Integer**](integer.md) | The internal ID from mySQL (not really necessary, to be removed) | [default to null]
**toMSP** | [**String**](string.md) | The partner MSP that is also involved | [default to null]
**data** | [**String**](string.md) | A base64 encoded document | [default to null]

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)

