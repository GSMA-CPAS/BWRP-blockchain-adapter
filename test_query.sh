#!/bin/bash
set -e -o errexit
export no_proxy="localhost,$no_proxy"

# allow env override
[ -z "$BSA_DTAG" ] && BSA_DTAG="localhost:8081"
[ -z "$BSA_TMUS" ] && BSA_TMUS="localhost:8082"

# SOME OPTIONS
SIGNER_DTAG="simon@dtag"
SIGNER_TMUS="simon@tmus"

# create a unique document if not passed via command line
[ -z "$DOCUMENT" ] && DOCUMENT=$(date +%s) 

DOCUMENT64=$(echo $DOCUMENT | openssl base64 | tr -d '\n')
DOCUMENTSHA256=$(echo -n $DOCUMENT64 | openssl dgst -sha256 -r | cut -d " " -f1)
echo "> calculated hash $DOCUMENTSHA256 for document"

# generate crypto material:
DIR=$(mktemp -d)
KEY=$DIR/KEY
CRT=$DIR/CRT
PUB_DTAG=$DIR/PUB_DTAG
PUB_TMUS=$DIR/PUB_TMUS
DOC=$DIR/DOC
# make sure to remove temp files on exit
trap "{ rm -fr $DIR; }" EXIT

function request {
    RET=$(curl -s -S -X $1 -H "Content-Type: application/json" -d "$2" "$3")
    echo $RET
    echo $RET | grep -i "error" > /dev/null && exit 1 || : 
}  

echo "###################################################"
echo "> setting rest uri on dtag"
request "PUT" '{"RestURI": "http://offchain-db-adapter-dtag:3333"}' http://$BSA_DTAG/config/offchain-db-adapter

echo "###################################################"
echo "> setting rest uri on tmus"
request "PUT" '{"RestURI": "http://offchain-db-adapter-tmus:3334"}' http://$BSA_TMUS/config/offchain-db-adapter

echo "###################################################"
echo "> storing document on both parties by calling the function on DTAG with the partner id TMUS"
request "POST" '{ "ToMSP" : "TMUS", "Data" : "'$DOCUMENT64'" }'  http://$BSA_DTAG/private-documents

echo "###################################################"
echo "> dtag signs contract"
# generate key and crt
openssl req -x509 -newkey ec:<(openssl ecparam -name secp384r1) -nodes -keyout $KEY -out $CRT -subj "/CN=${SIGNER_DTAG}/C=DE/ST=NRW/L=Bielefeld/O=ORG/OU=ORGOU" -addext keyUsage=digitalSignature 2> /dev/null
# create pem formatted with \n
PEM=$(cat $CRT | awk 1 ORS='\\n')
# extract public key
openssl x509 -pubkey -in $CRT > $PUB_DTAG
# do the signing
SIGNATURE=$(echo -ne $DOCUMENT | openssl dgst -sha256 -sign $KEY | openssl base64 | tr -d '\n')
# call blockchain adapter
request "PUT" '{"Signer": "'$SIGNER_DTAG'", "PEM" : "'"${PEM}"'", "Signature" : "'$SIGNATURE'" }'  http://$BSA_DTAG/signatures/$DOCUMENTSHA256

echo "###################################################"
echo "> tmus signs contract"
# generate key and crt
openssl req -x509 -newkey ec:<(openssl ecparam -name secp384r1) -nodes -keyout $KEY -out $CRT -subj "/CN=${SIGNER_TMUS}/C=DE/ST=NRW/L=Bielefeld/O=ORG/OU=ORGOU" -addext keyUsage=digitalSignature 2> /dev/null
# create pem formatted with \n
PEM=$(cat $CRT | awk 1 ORS='\\n')
# extract public key
openssl x509 -pubkey -in $CRT > $PUB_TMUS
# do the signing
SIGNATURE=$(echo -ne $DOCUMENT | openssl dgst -sha256 -sign $KEY | openssl base64  | tr -d '\n')
# call the blockchain adapter
request "PUT" '{"Signer": "'$SIGNER_TMUS'", "PEM" : "'"${PEM}"'", "Signature" : "'$SIGNATURE'" }'  http://$BSA_TMUS/signatures/$DOCUMENTSHA256

echo "###################################################"
echo "> fetching contract from dtag"
RES=$(request "GET" "" http://$BSA_DTAG/private-documents/$DOCUMENTSHA256)
FETCHED_DOC64=$(echo "$RES" | jq -r .Data)
FETCHED_TS=$(echo "$RES" | jq -r .Timestamp)
FETCHED_FROM=$(echo "$RES" | jq -r .FromMSP)
FETCHED_TO=$(echo "$RES" | jq -r .ToMSP)
echo "> $FETCHED_TS: $FETCHED_FROM -> $FETCHED_TO, document data b64 = '$FETCHED_DOC64'"

echo "###################################################"
echo "> fetching dtag signatures"
SIGNATURES=$(request "GET" "" http://$BSA_DTAG/signatures/$DOCUMENTSHA256/DTAG)
DTAG_SIGNATURE=$(echo $SIGNATURES | jq -r .[].Signature)
echo "> got DTAG signature $DTAG_SIGNATURE"

echo "> verifying signature"
FETCHED_DOC=$(echo $FETCHED_DOC64 | openssl base64 -d)
echo -n $FETCHED_DOC > $DOC
echo $DTAG_SIGNATURE | openssl base64 -d | openssl dgst -sha256 -verify $PUB_DTAG -signature /dev/stdin $DOC

echo "###################################################"
echo "> fetching tmus signatures"
SIGNATURES=$(request "GET" "" http://$BSA_DTAG/signatures/$DOCUMENTSHA256/TMUS)
TMUS_SIGNATURE=$(echo $SIGNATURES | jq -r .[].Signature)
echo "> got TMUS signature $TMUS_SIGNATURE"

echo "> verifying signature"
echo -ne $DOCUMENT > $DOC
echo $TMUS_SIGNATURE | openssl base64 -d | openssl dgst -sha256 -verify $PUB_TMUS -signature /dev/stdin $DOC

