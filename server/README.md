# About

This is a POC for the blockchain-adapter server.

Two env variables can be used to configure the blockchain-adapter:
- export BSA_PORT="8080"
- export BSA_CCP="ccp/DTAG.json"
- ./run.sh

# NOTES

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
$> BSA_DTAG=localhost:8085 ./test_query.sh
> calculated hash d9f844a8acc78446ba437ababb5e1fd4fbb54d929d717d57954cc5359e8ea70a for document
###################################################
> setting rest uri on dtag
{"txID":"1cafeea809e747363c3da546f0b2b3bab331e60e6936d09b921909a9abd17701"}
###################################################
> setting rest uri on tmus
{ "txID": "589dd13df7a558cbab9034bae295130499d8d87e8af667b4bd1107a1219b3891" }
###################################################
> storing document on both parties
{"DataHash":"d9f844a8acc78446ba437ababb5e1fd4fbb54d929d717d57954cc5359e8ea70a"}
###################################################
> dtag signs contract
{"txID":"2ba002563d6e06274824267cd5a222c720eacf2077fb87b5c758be73ba00f3ee"}
###################################################
> tmus signs contract
{ "txID": "8f704dad4d62089f7077421edca68b2bc1d6296c9f182dbbb11e853fcc2080c1" }
###################################################
> fetching contract from dtag
> 2020-09-10 13:36:56: DTAG -> TMUS, document data b64 = 'MTU5OTc0NTAwNwo='
###################################################
> fetching dtag signatures
> got DTAG signature MGYCMQCrlt4c3+BaJi8fwdai7d4kQtQ3MztI7JWa/l4SrgBZMQAm43hE0BLT6dc+fqhB0TYCMQCkWcEKw7Cf94JueCMwy1aEj9skLNldRCkVQYcGxicEyi0ekyWlOTu9EWg88pPpUAA=
> verifying signature
Verified OK
###################################################
> fetching tmus signatures
> got TMUS signature MGQCMG/GcMYMLqUfXEEYOFHqX4YiCDR8Ko3KzO91NyQ8jeasTS4SWkx1JxN9Ir5qjmKblQIwNLUl+HVVZvU5ROy8LySBU8SoJVc8iqhx5pV3i7Qm2g2iIL+bf3oIF2Tkfv4ViaMt
> verifying signature
Verified OK
```