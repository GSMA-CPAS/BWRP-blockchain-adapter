#!/bin/bash
set -e

OPENAPI_VERSION="5.0.0-beta2"
OPENAPI_JAR=openapi-generator-cli-${OPENAPI_VERSION}.jar

if [ ! -f bin/${OPENAPI_JAR} ]; then
	echo "> downloading OPENAPI generator"
	mkdir -p bin
	cd bin
	wget https://repo1.maven.org/maven2/org/openapitools/openapi-generator-cli/${OPENAPI_VERSION}/openapi-generator-cli-${OPENAPI_VERSION}.jar
	cd ..
fi

echo "> generating server api stubs"
rm -rf codegen_server
mkdir -p codegen_server
java -jar bin/${OPENAPI_JAR} generate  -i openapi.yaml  -g nodejs-express-server -o codegen_server
cp codegen_server/api/openapi.yaml ../server/api/openapi.definition

echo "> generating markdown"
java -jar bin/${OPENAPI_JAR} generate  -i openapi.yaml  -g markdown -o doc
