# About

This is a POC for the blockchain-adapter.
The REST interface is defined using the openAPI standard (see api/openapi.yaml) and the
server code is created by teh swagger-codegen (node-server).
Changes in the api specification require a rebuild (cd api; ./generate_api_stubs.sh) and 
a manual merge of the generated stubs and the implementation in controllers and service.

Two env variables can be used to configure the blockchain-adapter:
- export BSA_PORT="8080"
- export BSA_CCP="ccp/DTAG.json"

The full api specification can be accessed via http://localhost:$BSA_PORT/docs once the service is running.

# SHORT API DOC

<!-- markdown-swagger -->
 Endpoint                      | Method | Auth? | Description                                                                   
 ----------------------------- | ------ | ----- | ------------------------------------------------------------------------------
 `/private-documents`          | POST   | No    | Upload a private document                                                     
 `/private-documents/{hash}`   | GET    | No    | Fetch a private document from the database                                    
 `/config/offchain-db-adapter` | PUT    | No    | Update the configuration of the offchain-db-adapter                           
 `/signatures`                 | POST   | No    | store a signature for a given document on the ledger                          
 `/signatures/{hash}/{msp}`    | GET    | No    | fetch all signatures for a given msp and a given document hash from the ledger
<!-- /markdown-swagger -->

# NOTES

- this ist just a POC, DO NOT USE in production!
- the certificates used here are from the "local setup" distribution [DO NOT USE in production!]
- known issues:
  - fabric connection is initiated and closed on every rest call (does not scale!)
  - default serer config is verbose, stack traces should be removed from responses
  - ...


# tutorial:

- [this is preleminary, please wait for the integration into the local setup]
- shell 1: BSA_CCP="ccp/DTAG.json" BSA_PORT=8080 ./run.sh
- shell 2: BSA_CCP="ccp/TMUS.json" BSA_PORT=8081 ./run.sh
- shell 3: ./test_query.sh
- example output:
```
$ ./test_query.sh 
###################################################
> setting rest uri on dtag
{
  "txID": "0b5f2725d8b1b5f739e04a41836d4c8b027ff88001bde57297844eef35a7a43b"
}
###################################################
> setting rest uri on tmus
{
  "txID": "c890bc128d6aa1d9c881dfcfd45d281f26bae173b9aa207d159a78e55246569e"
}
###################################################
> storing document on both parties
{
  "DataHash": "ebdb0f14c91d269382a8333dd8ab64aa67c392edbbbf35eacc26cb3b3328dc89"
}
###################################################
> dtag signs contract
Generating an EC private key
writing new private key to '/tmp/filejCCK95'
-----
{
  "txID": "e8550cc7b2a0cb66819de5645158423eef009ceb55a2dd1ec22dfe8a479accf8"
}
###################################################
> tmus signs contract
Generating an EC private key
writing new private key to '/tmp/filejCCK95'
-----
{
  "txID": "032a067f6a86d443489876a25d438793e7750c63d0faffd4973b580264b8a4b6"
}
###################################################
> fetching dtag signatures
> got MGUCMQCZnY6OF83iJinYRXmIJLmwnLVxisKpXwt54euU6CmCDeQHguhIcqhrzwzYY1QfIPgCME3EEXKtueoRPNv5DflrpOKWdzZxq26vTRGXtmTqk206KCft8FLS0pQGDhiBAVIi4w==
> verifying signature MGUCMQCZnY6OF83iJinYRXmIJLmwnLVxisKpXwt54euU6CmCDeQHguhIcqhrzwzYY1QfIPgCME3EEXKtueoRPNv5DflrpOKWdzZxq26vTRGXtmTqk206KCft8FLS0pQGDhiBAVIi4w==

Verified OK
###################################################
> fetching tmus signatures
> got MGQCMET27hhqvlEgzTvGKDllC/AATyZPUMPGn7w4UyOI6wvTYIpNZyd7RZpHleEv+tpjfwIwSMQkjGHhgykunuFgt/iAFrRXgzDS+NykvrUzvBJvJzFl6+Yq/85kEESQam09c5O8
> verifying signature MGQCMET27hhqvlEgzTvGKDllC/AATyZPUMPGn7w4UyOI6wvTYIpNZyd7RZpHleEv+tpjfwIwSMQkjGHhgykunuFgt/iAFrRXgzDS+NykvrUzvBJvJzFl6+Yq/85kEESQam09c5O8

Verified OK
```