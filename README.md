<!--
 SPDX-FileCopyrightText: 2021 GSMA and all contributors.

 SPDX-License-Identifier: Apache-2.0
-->
# About

This is a POC for the blockchain-adapter and a proposal for its REST Api..

NOTE: the API is a WIP and is subject to change!

The REST interface is defined using the openAPI standard (see [definition file](./api/openapi.yaml)).
The [server code](./server/README.md) is created by the nodejs-express-server codegen.
The [client code](./client/README.md) is created by the typescript-node codegen.
See api/generate.sh for details.

# API Documentation

see the auto-generated [API Documentation](./api/doc/README.md)
alternative: the full online api specification can be accessed via http://localhost:$BSA_PORT/api-docs once the server is running.

# NOTES

- this ist just a POC, DO NOT USE in production!
- the certificates used here are from the "local setup" distribution [DO NOT USE in production!]

# Useful links

- [OpenAPI 3.0.3](http://spec.openapis.org/oas/v3.0.3)
- [Google JSON styleguide](https://google.github.io/styleguide/jsoncstyleguide.xml)
- [PUT vs POST](https://restfulapi.net/rest-put-vs-post/)

## How to Contribute

Contribution and feedback is encouraged and always welcome. This project is governed by the Distributed Ledger Technology (DLT) group, which is a GSMA Industry Specifications Issuing Group (DLT ISIG). For more information about how to contribute, the project structure, as well as additional contribution information, see the DLT Governance Principles at https://www.gsma.com/newsroom/resources/dlt-01-dlt-governance-principles/.

## Contributors

Our commitment to open source means that we are enabling -in fact encouraging- all interested parties to contribute and become part of its developer community.

## Licensing

Copyright (c) 2022 GSMA and all other contributors.

Licensed under the **Apache License, Version 2.0** (the "License"); you may not use this file except in compliance with the License.

You may obtain a copy of the License at https://www.apache.org/licenses/LICENSE-2.0.

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the [LICENSE](./LICENSES/LICENSE) for the specific language governing permissions and limitations under the License.
