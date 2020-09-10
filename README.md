# About

This is a POC for the blockchain-adapter.

The REST interface is defined using the openAPI standard (see api/openapi.yaml).
The [server code](./server/README.md) is created by the nodejs-express-server codegen.
The [client code](./client/README.md) is created by the typescript-node codegen.
See api/generate.sh for details.

# API Documentation

see the auto-generated [API Documentation](./api/doc/README.md)
alternative: the full online api specification can be accessed via http://localhost:$BSA_PORT/docs once the server is running.

# NOTES

- this ist just a POC, DO NOT USE in production!
- the certificates used here are from the "local setup" distribution [DO NOT USE in production!]

