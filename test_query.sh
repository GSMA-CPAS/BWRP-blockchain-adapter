#!/bin/bash
set -ex
export no_proxy="localhost,$no_proxy"

DTAG_PORT=8080
TMUS_PORT=8081

#DOCUMENT="MYDOCUMENT_DATA_123456..."
# create a unique document:
DOCUMENT=$(date +%s) 
DOCUMENT64=$(echo $DOCUMENT|base64 -w0)
DOCUMENTSHA256=$(echo -n $DOCUMENT64|sha256sum|cut -d " " -f1)

echo "###################################################"
echo "> setting rest uri on dtag"
curl -i -X PUT -H "Content-Type: application/json" -d '{"rest_uri": "http://offchain-db-adapter-dtag:3333/documents"}'  http://localhost:${DTAG_PORT}/config/offchain-db-adapter
echo ""

echo "###################################################"
echo "> setting rest uri on tmus"
curl -i -X PUT -H "Content-Type: application/json" -d '{"rest_uri": "http://offchain-db-adapter-tmus:3334/documents"}'  http://localhost:${TMUS_PORT}/config/offchain-db-adapter
echo ""

echo "###################################################"
echo "> storing document on both parties"
curl -i -X POST -H "Content-Type: application/json" -d '{"partner_msp": "TMUS", "document": "'$DOCUMENT64'" }'  http://localhost:${DTAG_PORT}/private-documents
echo ""

# generate crypto material:
SIGNER="simon@dtag"
KEY=$(tempfile)
CRT=$(tempfile)
# make sure to remove temp files on exit
trap "{ rm -f $KEY $CRT; }" EXIT
# generate key and crt
openssl req -x509 -newkey ec:<(openssl ecparam -name secp384r1) -nodes -keyout $KEY -out $CRT -subj "/CN=${SIGNER}/C=DE/ST=NRW/L=Bielefeld/O=ORG/OU=ORGOU" -addext keyUsage=digitalSignature
# create pem formatted with \n
PEM=$(cat $CRT | awk 1 ORS='\\n')
#sign the file
SIGNATURE=$(echo $DOCUMENT | openssl dgst -sha256 -sign $KEY | base64 -w0)

#sign the contract
echo "###################################################"
echo "> dtag signs contract"
curl -i -X POST -H "Content-Type: application/json" -d '{"signer": "'$SIGNER'", "pem" : "'"${PEM}"'", "signature" : "'$SIGNATURE'", "document": "'$DOCUMENT64'" }'  http://localhost:${DTAG_PORT}/signatures
echo ""

#fetch all signatures
echo "###################################################"
echo "> fetching dtag signatures"
curl -i -X GET -H "Content-Type: application/json"  http://localhost:${DTAG_PORT}/signatures/$DOCUMENTSHA256/DTAG
echo ""

#openssl x509 -pubkey -noout -in example.crt

rm $KEY
rm $CRT