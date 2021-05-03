<!--
 SPDX-FileCopyrightText: 2021 the BWRP-chaincode contributors.

 SPDX-License-Identifier: Apache-2.0
-->
# About

This is a POC for the blockchain-adapter server.

Three env variables can be used to configure the blockchain-adapter:
- export BSA_PORT="8080"
- export BSA_CCP="ccp/DTAG.json"
- export BSA_DEBUG=1
- ./tools/run.sh

# NOTES

- known issues:
  - fabric connection is initiated and closed on every rest call (does not scale!)
  - default serer config is verbose, stack traces should be removed from responses
  - ...

- testing webhooks
  - for debugging/developing there is a small test script in server/tools/webhook_dummy_sever

# tutorial:

- [this is preleminary, please wait for the integration into the local setup]
- shell 1: BSA_CCP="ccp/DTAG.json" BSA_PORT=8080 ./server/tools/run.sh
- shell 2: BSA_CCP="ccp/TMUS.json" BSA_PORT=8081 ./server/tools/run.sh
- shell 3: ./test_query.sh
- example output:
```
$> BSA_DTAG=localhost:8085 ./test_query.sh
...
> verifying signature
Verified OK
```