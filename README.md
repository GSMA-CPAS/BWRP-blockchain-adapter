# About

This is a POC for the blockchain-adapter and a proposal for its REST Api..

NOTE: the API is a WIP and is subject to change!

The REST interface is defined using the openAPI standard (see [definition file](./api/openapi.yaml)).
The [server code](./server/README.md) is created by the nodejs-express-server codegen.
The [client code](./client/README.md) is created by the typescript-node codegen.
See api/generate.sh for details.

# API Documentation

see the auto-generated [API Documentation](./api/doc/README.md)
alternative: the full online api specification can be accessed via http://localhost:$BSA_PORT/docs once the server is running.

# NOTES

- this ist just a POC, DO NOT USE in production!
- the certificates used here are from the "local setup" distribution [DO NOT USE in production!]

# Useful links

- [OpenAPI 3.0.3](http://spec.openapis.org/oas/v3.0.3)
- [Google JSON styleguide](https://google.github.io/styleguide/jsoncstyleguide.xml)
- [PUT vs POST](https://restfulapi.net/rest-put-vs-post/)
