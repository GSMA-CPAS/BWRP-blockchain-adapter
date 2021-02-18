#!/bin/bash
set -e -o errexit 
export no_proxy="localhost,$no_proxy"



function concat(){
    local res=""
    for var in "$@"; do
        if [ -z $res ]; then
            res=$var
        else
            res="$res:$var"
        fi
    done
    echo $res
}

function hash(){
    echo "$1" | openssl dgst -sha256 -r | cut -d " " -f1
}

#pass msp, referenceid, payloadlink
function payload() {
    hash $(concat "$1" "$2" "$3")
}

# pass referenceid documenthash
function payloadlink(){
    hash $(concat "$1" "$2")
}


# allow env override
[ -z "$BSA_DTAG" ] && BSA_DTAG="localhost:8081"
[ -z "$BSA_TMUS" ] && BSA_TMUS="localhost:8082"
[ ! -z "$BSA_DEBUG" ] && set -e -x

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
    echo $RET | grep -i "error" > /dev/null && echo $RET > /dev/stderr && exit 1 || : 
}

function createRoot {
    ORG=$1
    echo -ne "[ default ]\nbasicConstraints = critical,CA:true\nkeyUsage = critical,keyCertSign\n" > $DIR/ca.$ORG.ext
    attr_hex=$(echo -n '{"attrs":{"CanSignDocument":"yes"}}' | xxd -ps -c 200 | tr -d '\n')
    echo -ne "[default]\n1.2.3.4.5.6.7.8.1=DER:$attr_hex\n" > $DIR/user.$ORG.ext

    # create ca 
    openssl req -new -newkey ec -pkeyopt ec_paramgen_curve:secp384r1 -nodes -out $DIR/root.$ORG.csr -keyout $DIR/root.$ORG.key  -subj "/CN=ROOT@$ORG/C=DE/ST=NRW/L=Bielefeld/O=$ORG/OU=${ORG}OU" 
    openssl x509 -signkey $DIR/root.$ORG.key -days 365 -req -in $DIR/root.$ORG.csr -out $DIR/root.$ORG.pem  --extfile $DIR/ca.$ORG.ext
    openssl x509 -in $DIR/root.$ORG.pem > $DIR/root.$ORG.crt
}

function createUserCert {
    ORG=$1
    
    # create signing request
    openssl req -newkey ec -pkeyopt ec_paramgen_curve:secp384r1 -nodes -keyout $DIR/user.$ORG.key -out $DIR/user.$ORG.csr  -subj "/CN=user@$ORG/C=DE/ST=NRW/L=Bielefeld/O=$ORG/OU=${ORG}OU"

    # use ca to sign it
    openssl x509 -CA $DIR/root.$ORG.crt -CAkey $DIR/root.$ORG.key -CAcreateserial -req -in  $DIR/user.$ORG.csr -out $DIR/user.$ORG.pem -extfile $DIR/user.$ORG.ext -days 365
    openssl x509 -in $DIR/user.$ORG.pem > $DIR/user.$ORG.crt

    # replace newlines
    cat $DIR/user.$ORG.crt | awk 1 ORS='\\n' > $DIR/user.$ORG.crt_newline
}

echo "###################################################"
echo "> creating root and user certs"
echo "###################################################"
createRoot DTAG
createUserCert DTAG
createRoot TMUS
createUserCert TMUS

echo "###################################################"
echo "> storing root cert on DTAG"
request PUT "[\"$(cat $DIR/root.DTAG.pem | awk 1 ORS='\\n' )\"]" http://$BSA_DTAG/config/certificates/root
echo "> storing root cert on TMUS"
request PUT "[\"$(cat $DIR/root.TMUS.pem | awk 1 ORS='\\n' )\"]" http://$BSA_TMUS/config/certificates/root

echo "###################################################"
echo "> storing document on both parties by calling the function on DTAG with the partner id TMUS"
RES=$(request "POST" '{ "toMSP" : "TMUS", "data" : "'$DOCUMENT64'" }'  http://$BSA_DTAG/private-documents)
echo $RES
REFERENCE_ID=$(echo "$RES" | jq -r .referenceID)
PAYLOADLINK=$(payloadlink $REFERENCE_ID":"$DOCUMENTSHA256)

echo "###################################################"
echo "> dtag signs contract"
# do the signing
CERT=$(cat $DIR/user.DTAG.crt_newline)
SIGNATUREPAYLOAD=$(echo -ne "DTAG:$REFERENCE_ID:$PAYLOADLINK" | openssl dgst -sha256 -r | cut -d " " -f1)
SIGNATURE=$(echo -ne $SIGNATUREPAYLOAD | openssl dgst -sha256 -sign $DIR/user.DTAG.key | openssl base64 | tr -d '\n')
# call blockchain adapter
RES=$(request "PUT" '{"algorithm": "secp384r1", "certificate" : "'"${CERT}"'", "signature" : "'$SIGNATURE'" }'  http://$BSA_DTAG/signatures/$DOCUMENT_ID)
TXID_DTAG=$(echo $RES | jq -r .txID)
echo "> stored signature with txid $TXID_DTAG"

echo "###################################################"
echo "> tmus signs contract"
# do the signing
CERT=$(cat $DIR/user.DTAG.crt_newline)

SIGNATUREPAYLOAD=$(echo -ne "TMUS:$REFERENCE_ID:$PAYLOADLINK" | openssl dgst -sha256 -r | cut -d " " -f1)
SIGNATURE=$(echo -ne $SIGNATUREPAYLOAD | openssl dgst -sha256 -sign $DIR/user.TMUS.key | openssl base64 | tr -d '\n')

# call blockchain adapter
RES=$(request "PUT" '{"algorithm": "secp384r1", "certificate" : "'"${CERT}"'", "signature" : "'$SIGNATURE'" }'  http://$BSA_TMUS/signatures/$DOCUMENT_ID)
TXID_TMUS=$(echo $RES | jq -r .txID)
echo "> stored signature with txid $TXID_TMUS"

echo "###################################################"
echo "> verify dtag signature on-chain"
RES=$(request PUT "[\"$DOCUMENT\"]" http://$BSA_DTAG/signatures/$DOCUMENT_ID/DTAG/verify)
echo $RES | jq 
VALID=$(echo $RES | jq -r .$TXID_DTAG.valid)
if [ $VALID == "true" ]; then
    echo "SIGNATURE VALID!"
else
    echo "FAILED"
    exit 1
fi

echo "###################################################"
echo "> verify tmus signature on-chain"
RES=$(request PUT "[\"$DOCUMENT\"]" http://$BSA_DTAG/signatures/$DOCUMENT_ID/TMUS/verify)
echo $RES | jq 
VALID=$(echo $RES | jq -r .$TXID_TMUS.valid)
if [ $VALID == "true" ]; then
    echo "SIGNATURE VALID!"
else
    echo "FAILED"
    exit 1
fi

exit 0




echo "###################################################"
echo "> removing document from transient db on DTAG"
RES=$(request "DELETE" ''  http://$BSA_DTAG/private-documents/$REFERENCE_ID)
echo $RES


echo "###################################################"
echo "> fetching list pf referenceIDs from DTAG"
RES=$(request "GET" ''  http://$BSA_DTAG/private-documents/)
echo $RES
