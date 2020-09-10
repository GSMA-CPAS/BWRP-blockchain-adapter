#!/bin/bash
set -e

SWAGGER_VERSION="3.0.21"
SWAGGER_JAR=swagger-codegen-cli-${SWAGGER_VERSION}.jar

if [ ! -f bin/${SWAGGER_JAR} ]; then
	echo "> downloading swagger generator"
	mkdir -p bin
	cd bin
	wget https://repo1.maven.org/maven2/io/swagger/codegen/v3/swagger-codegen-cli/${SWAGGER_VERSION}/${SWAGGER_JAR}
	cd ..
fi

echo "> generating api stubs"
rm -rf codegen
mkdir -p codegen
java -jar bin/${SWAGGER_JAR} generate  -i openapi.yaml  -l nodejs-server -o codegen
cp codegen/api/openapi.yaml ./openapi.definition.out

# try to update api doc
if [ ! $(which markdown-swagger) ]; then 
	npm install -g markdown-swagger
fi
markdown-swagger ./codegen/api/openapi.yaml  ../README.md
