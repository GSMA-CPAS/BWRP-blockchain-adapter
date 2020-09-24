# WebhookApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**webhooksSubscribePost**](WebhookApi.md#webhooksSubscribePost) | **POST** /webhooks/subscribe | 
[**webhooksSubscriptionIDDelete**](WebhookApi.md#webhooksSubscriptionIDDelete) | **DELETE** /webhooks/{subscriptionID} | 


<a name="webhooksSubscribePost"></a>
# **webhooksSubscribePost**
> String webhooksSubscribePost(SubscriptionRequest)



    subscribes a client to receive the specified event

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **SubscriptionRequest** | [**SubscriptionRequest**](../Models/SubscriptionRequest.md)| A document that should be uploaded | [optional]

### Return type

[**String**](../Models/string.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: text/plain

<a name="webhooksSubscriptionIDDelete"></a>
# **webhooksSubscriptionIDDelete**
> webhooksSubscriptionIDDelete(subscriptionID)



    unsubscribes a client from the specified event

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **subscriptionID** | **String**| The unique identifier of the subscription you want to unsubscribe from | [default to null]

### Return type

null (empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined

