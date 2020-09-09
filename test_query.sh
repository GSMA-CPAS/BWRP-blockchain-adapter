#!/bin/bash
set -ex
export no_proxy="localhost,$no_proxy"

BSA_DTAG="blockchain-adapter-dtag:8082"
BSA_TMUS="blockchain-adapter-tmus:8081"

# SOME OPTIONS
SIGNER_DTAG="simon@dtag"
SIGNER_TMUS="simon@tmus"

#DOCUMENT="MYDOCUMENT_DATA_123456..."
# create a unique document:
DOCUMENT=$(date +%s) 
DOCUMENT64=$(echo $DOCUMENT | openssl base64 | tr -d '\n')
DOCUMENTSHA256=$(echo -n $DOCUMENT64 | openssl dgst -sha256 -r | cut -d " " -f1)

# generate crypto material:
DIR=$(mktemp -d)
KEY=$DIR/KEY
CRT=$DIR/CRT
PUB_DTAG=$DIR/PUB_DTAG
PUB_TMUS=$DIR/PUB_TMUS
DOC=$DIR/DOC
# make sure to remove temp files on exit
trap "{ rm -fr $DIR; }" EXIT

echo "###################################################"
echo "> setting rest uri on dtag"
curl -s -X PUT -H "Content-Type: application/json" -d '{"rest_uri": "http://offchain-db-adapter-dtag:3333/documents"}'  http://${BSA_DTAG}/config/offchain-db-adapter 
echo ""

echo "###################################################"
echo "> setting rest uri on tmus"
curl -s -X PUT -H "Content-Type: application/json" -d '{"rest_uri": "http://offchain-db-adapter-tmus:3334/documents"}'  http://${BSA_TMUS}/config/offchain-db-adapter
echo ""

echo "###################################################"
echo "> storing document on both parties"
curl -s  -X POST -H "Content-Type: application/json" -d '{"partner_msp": "TMUS", "document": "'$DOCUMENT64'" }'  http://${BSA_DTAG}/private-documents
echo ""


# DTAG signs the contract
echo "###################################################"
echo "> dtag signs contract"
# generate key and crt
openssl req -x509 -newkey ec:<(openssl ecparam -name secp384r1) -nodes -keyout $KEY -out $CRT -subj "/CN=${SIGNER_DTAG}/C=DE/ST=NRW/L=Bielefeld/O=ORG/OU=ORGOU" -addext keyUsage=digitalSignature
# create pem formatted with \n
PEM=$(cat $CRT | awk 1 ORS='\\n')
# extract public key
openssl x509 -pubkey -in $CRT > $PUB_DTAG
# do the signing
SIGNATURE=$(echo -ne $DOCUMENT | openssl dgst -sha256 -sign $KEY | openssl base64 | tr -d '\n')
# call blockchain adapter
curl -s -X POST -H "Content-Type: application/json" -d '{"signer": "'$SIGNER_DTAG'", "pem" : "'"${PEM}"'", "signature" : "'$SIGNATURE'", "document": "'$DOCUMENT64'" }'  http://${BSA_DTAG}/signatures
echo ""

# TMUS signs the contract
echo "###################################################"
echo "> tmus signs contract"
# generate key and crt
openssl req -x509 -newkey ec:<(openssl ecparam -name secp384r1) -nodes -keyout $KEY -out $CRT -subj "/CN=${SIGNER_TMUS}/C=DE/ST=NRW/L=Bielefeld/O=ORG/OU=ORGOU" -addext keyUsage=digitalSignature
# create pem formatted with \n
PEM=$(cat $CRT | awk 1 ORS='\\n')
# extract public key
openssl x509 -pubkey -in $CRT > $PUB_TMUS
# do the signing
SIGNATURE=$(echo -ne $DOCUMENT | openssl dgst -sha256 -sign $KEY | openssl base64  | tr -d '\n')
# call the blockchain adapter
curl -s -X POST -H "Content-Type: application/json" -d '{"signer": "'$SIGNER_TMUS'", "pem" : "'"${PEM}"'", "signature" : "'$SIGNATURE'", "document": "'$DOCUMENT64'" }'  http://${BSA_TMUS}/signatures
echo ""


#fetch all DTAG signatures
echo "###################################################"
echo "> fetching dtag signatures"
SIGNATURES=$(curl -s -X GET -H "Content-Type: application/json"  http://${BSA_DTAG}/signatures/$DOCUMENTSHA256/DTAG)
DTAG_SIGNATURE=$(echo $SIGNATURES | jq -r .[].signature)
echo "> got $DTAG_SIGNATURE"

echo "> verifying signature $DTAG_SIGNATURE"
echo ""
echo -ne $DOCUMENT > $DOC
echo $DTAG_SIGNATURE | openssl base64 -d | openssl dgst -sha256 -verify $PUB_DTAG -signature /dev/stdin $DOC

#fetch all TMUS signatures
echo "###################################################"
echo "> fetching tmus signatures"
SIGNATURES=$(curl -s -X GET -H "Content-Type: application/json"  http://${BSA_DTAG}/signatures/$DOCUMENTSHA256/TMUS)
TMUS_SIGNATURE=$(echo $SIGNATURES | jq -r .[].signature)
echo "> got $TMUS_SIGNATURE"

echo "> verifying signature $TMUS_SIGNATURE"
echo ""
echo -ne $DOCUMENT > $DOC
echo $TMUS_SIGNATURE | openssl base64 -d | openssl dgst -sha256 -verify $PUB_TMUS -signature /dev/stdin $DOC

