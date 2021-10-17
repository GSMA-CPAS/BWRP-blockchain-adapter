#!/bin/bash
# SPDX-FileCopyrightText: 2021 GSMA and all contributors.
#
# SPDX-License-Identifier: Apache-2.0
set -e

OPENAPI_VERSION="5.0.0-beta3"
OPENAPI_JAR=openapi-generator-cli-${OPENAPI_VERSION}.jar

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd $DIR

if [ ! -f .bin/${OPENAPI_JAR} ]; then
	echo "> downloading OPENAPI generator"
	mkdir -p .bin
	cd .bin
	wget https://repo1.maven.org/maven2/org/openapitools/openapi-generator-cli/${OPENAPI_VERSION}/openapi-generator-cli-${OPENAPI_VERSION}.jar
	cd ..
fi

log=$(mktemp)

echo "> generating server api stubs"
java -jar .bin/${OPENAPI_JAR} generate  -i openapi.yaml  -g nodejs-express-server -o ../server | tee $log

echo "> generating markdown"
rm -r doc
java -jar .bin/${OPENAPI_JAR} generate  -i openapi.yaml  -g markdown -o doc | tee -a $log

# add license info to generated files:
FILES=$(cat $log |grep writing | cut -d " " -f8)

# define license. NOTE: keep the "" after the SPDX tag in order not to break the reuse parser (bug)
LICENSE="# SPDX-FileCopyrightText: 2021 GSMA and all contributors.\n#\n# SPDX-""License-Identifier: Apache-2.0\n"

while IFS= read -r line; do
   echo "adding license to "$line".license"
   echo -ne $LICENSE > "$line.license"
done <<< "$FILES"

rm $log 
