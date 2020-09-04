# NOTES

- this ist just a POC, DO NOT USE in production!
- the certificates used here are from the "local setup" distribution [DO NOT USE in production!]
- known issues:
  - fabric connection is initiated and closed on every rest call (does not scale!)
  - default serer config is verbose, stack traces should be removed from responses
  - ...


# tutorial:

- shell 1: BSA_CCP="ccp/DTAG.json" BSA_PORT=8080 ./run.sh
- shell 2: BSA_CCP="ccp/TMUS.json" BSA_PORT=8081 ./run.sh
- shell 3: ./test_query.sh