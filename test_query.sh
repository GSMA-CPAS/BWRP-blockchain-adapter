#!/bin/bash
# SPDX-FileCopyrightText: 2021 GSMA and all contributors.
#
# SPDX-License-Identifier: Apache-2.0
#
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
    echo "$res"
}

function hash(){
    echo -ne "$1" | openssl dgst -sha256 -r | cut -d " " -f1
}

#pass msp, referenceid, payloadlink
function payload() {
    local MSP=$1
    local REFERENCE_ID=$2
    local PAYLOADLINK=$3
    hash $(concat "$MSP" "$REFERENCE_ID" "$PAYLOADLINK")
}

# pass referenceid documenthash
function payloadlink(){
    local REFERENCE_ID=$1
    local PAYLOADHASH=$2
    hash $(concat "$REFERENCE_ID" "$PAYLOADHASH")
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
    echo $RET | grep -i "err" > /dev/null && echo $RET > /dev/stderr && exit 1 || : 
}

function request_noexit {    
    RET=$(curl -s -S -X $1 -H "Content-Type: application/json" -d "$2" "$3")
    echo $RET
}

function createRoot {
    ORG=$1
    echo -ne "[ default ]\nbasicConstraints = critical,CA:true\nkeyUsage = critical,keyCertSign\n" > $DIR/ca.$ORG.ext
    
    # create ca 
    openssl req -new -newkey ec -pkeyopt ec_paramgen_curve:secp384r1 -nodes -out $DIR/root.$ORG.csr -keyout $DIR/root.$ORG.key  -subj "/CN=ROOT@$ORG/C=DE/ST=NRW/L=Bielefeld/O=$ORG/OU=${ORG}OU" 
    openssl x509 -signkey $DIR/root.$ORG.key -days 365 -req -in $DIR/root.$ORG.csr -out $DIR/root.$ORG.pem  --extfile $DIR/ca.$ORG.ext
    openssl x509 -in $DIR/root.$ORG.pem > $DIR/root.$ORG.crt
}

function createIntermediateCert {
    ORG=$1
    echo -ne "[ default ]\nbasicConstraints = critical,CA:true\nkeyUsage = critical,keyCertSign\n" > $DIR/intermediate.$ORG.ext

    # use root ca to sign it
    openssl req -new -newkey ec -pkeyopt ec_paramgen_curve:secp384r1 -nodes -out $DIR/intermediate.$ORG.csr -keyout $DIR/intermediate.$ORG.key  -subj "/CN=INTERMEDIATE@$ORG/C=DE/ST=BE/L=Berlin/O=$ORG/OU=${ORG}OU" 
    openssl x509 -CA $DIR/root.$ORG.crt -CAkey $DIR/root.$ORG.key -CAcreateserial -req -in $DIR/intermediate.$ORG.csr -out $DIR/intermediate.$ORG.pem -extfile $DIR/intermediate.$ORG.ext -days 365
    openssl x509 -in $DIR/intermediate.$ORG.pem > $DIR/intermediate.$ORG.crt
    # openssl requires crt w/o \n, the API requests to
    cat $DIR/intermediate.$ORG.crt | awk 1 ORS='\\n' > $DIR/intermediate_api.$ORG.crt
}

function createUserCert {
    ORG=$1
    SIGNER=$2

    # user attributes
    attr_hex=$(echo -n '{"attrs":{"CanSignDocument":"yes"}}' | xxd -ps -c 200 | tr -d '\n')
    echo -ne "[default]\n1.2.3.4.5.6.7.8.1=DER:$attr_hex\n" > $DIR/user.$ORG.ext

    # create signing request
    openssl req -newkey ec -pkeyopt ec_paramgen_curve:secp384r1 -nodes -keyout $DIR/user.$ORG.key -out $DIR/user.$ORG.csr  -subj "/CN=user@$ORG/C=DE/ST=NRW/L=Bielefeld/O=$ORG/OU=${ORG}OU"

    # use ca to sign it
    openssl x509 -CA $DIR/$SIGNER.$ORG.crt -CAkey $DIR/$SIGNER.$ORG.key -CAcreateserial -req -in $DIR/user.$ORG.csr -out $DIR/user.$ORG.pem -extfile $DIR/user.$ORG.ext -days 365
    openssl x509 -in $DIR/user.$ORG.pem | awk 1 ORS='\\n' > $DIR/user.$ORG.crt
    

    # create an additional "broken" cert that misses the extension flag CanSignDocument
    openssl x509 -CA $DIR/$SIGNER.$ORG.crt -CAkey $DIR/$SIGNER.$ORG.key -CAcreateserial -req -in  $DIR/user.$ORG.csr -out $DIR/user.$ORG.bad.pem -days 365
    openssl x509 -in $DIR/user.$ORG.bad.pem | awk 1 ORS='\\n' > $DIR/user.$ORG.bad.crt
}

echo "###################################################"
echo "> creating root, intermediate and user certs"
echo "###################################################"
createRoot DTAG 
createIntermediateCert DTAG 
createUserCert DTAG intermediate
createRoot TMUS
createUserCert TMUS root


echo "###################################################"
echo "> getting status information of TMUS"
RES=$(request "GET" '' http://$BSA_DTAG/status/offchain/TMUS)
STATUS=$(echo $RES | jq -r .status)
echo "TMUS Status: $STATUS"
if [ $STATUS != "OK" ]; then
    exit 1
fi

echo "###################################################"
echo "> storing root cert on DTAG"
request PUT "[\"$(cat $DIR/root.DTAG.pem | awk 1 ORS='\\n' )\"]" http://$BSA_DTAG/certificate/root
echo "> storing root cert on TMUS"
request PUT "[\"$(cat $DIR/root.TMUS.pem | awk 1 ORS='\\n' )\"]" http://$BSA_TMUS/certificate/root

echo "###################################################"
echo "> storing document on both parties by calling the function on DTAG with the partner id TMUS"
RES=$(request "POST" '{ "toMSP" : "TMUS", "payload" : "'$DOCUMENT64'" }'  http://$BSA_DTAG/private-documents)
echo $RES
REFERENCE_ID=$(echo "$RES" | jq -r .referenceID)
PAYLOADLINK=$(payloadlink $REFERENCE_ID $DOCUMENTSHA256)

echo "###################################################"
echo "> dtag signs contract"
# do the signing
CERT=$(cat $DIR/intermediate_api.DTAG.crt $DIR/user.DTAG.crt)
SIGNATUREPAYLOAD=$(payload "DTAG" "$REFERENCE_ID" "$PAYLOADLINK")
echo -e "> payload to sign <$SIGNATUREPAYLOAD>"
SIGNATURE_DTAG=$(echo -ne $SIGNATUREPAYLOAD | openssl dgst -sha256 -sign $DIR/user.DTAG.key | openssl base64 | tr -d '\n')
# call blockchain adapter
RES=$(request "PUT" '{"algorithm": "ecdsaWithSha256", "certificate" : "'"${CERT}"'", "signature" : "'$SIGNATURE_DTAG'" }'  http://$BSA_DTAG/signatures/$REFERENCE_ID)
TXID_DTAG=$(echo $RES | jq -r .txID)
echo "> stored signature with txid $TXID_DTAG"

echo "###################################################"
echo "> tmus signs contract"
# do the signing
CERT=$(cat $DIR/user.TMUS.crt)

SIGNATUREPAYLOAD=$(payload "TMUS" "$REFERENCE_ID" "$PAYLOADLINK")
echo -e "> payload to sign <$SIGNATUREPAYLOAD>"
SIGNATURE_TMUS=$(echo -ne $SIGNATUREPAYLOAD | openssl dgst -sha256 -sign $DIR/user.TMUS.key | openssl base64 | tr -d '\n')

# call blockchain adapter
RES=$(request "PUT" '{"algorithm": "ecdsaWithSha256", "certificate" : "'"${CERT}"'", "signature" : "'$SIGNATURE_TMUS'" }'  http://$BSA_TMUS/signatures/$REFERENCE_ID)
TXID_TMUS=$(echo $RES | jq -r .txID)
echo "> stored signature with txid $TXID_TMUS"

echo "###################################################"
echo "> verifying reference payload link for creator "
RES=$(request "GET" '' http://$BSA_DTAG/payloadlink/$REFERENCE_ID)
if [ $RES == "$PAYLOADLINK" ]; then
    echo "> ok. payloadlink on ledger matches local one!"
else
    echo "FAILED, expected: $PAYLOADLINK"
    echo "received        : $RES"
    exit 1
fi

echo "###################################################"
echo "> test get all signatures call on dtag: signed by TMUS "
RES=$(request "GET" '' http://$BSA_DTAG/signatures/$REFERENCE_ID/TMUS)
echo $RES | jq 
#echo $RES | jq .\"$TXID_TMUS\".signature
RECEIVED=$(echo $RES | jq -r .\"$TXID_TMUS\".signature)
if [ $RECEIVED == "$SIGNATURE_TMUS" ]; then
    echo "SIGNATURE FOUND!"
else
    echo "FAILED, expected: $SIGNATURE_TMUS"
    echo "received        : $RECEIVED"
    exit 1
fi

echo "###################################################"
echo "> test get all signatures call on dtag: signed by DTAG "
RES=$(request "GET" '' http://$BSA_DTAG/signatures/$REFERENCE_ID/DTAG)
echo $RES | jq 
#echo $RES | jq .\"$TXID_DTAG\".signature
RECEIVED=$(echo $RES | jq -r .\"$TXID_DTAG\".signature)
if [ $RECEIVED == "$SIGNATURE_DTAG" ]; then
    echo "SIGNATURE FOUND!"
else
    echo "FAILED, expected: $SIGNATURE_DTAG"
    echo "received        : $RECEIVED"
    exit 1
fi


echo "###################################################"
echo "> verify dtag signature on-chain"
RES=$(request "GET" '' http://$BSA_DTAG/signatures/$REFERENCE_ID/DTAG/verify)
echo $RES | jq 
VALID=$(echo $RES | jq -r .\"$TXID_DTAG\".valid)
if [ $VALID == "true" ]; then
    echo "SIGNATURE VALID!"
else
    echo "FAILED"
    exit 1
fi

echo "###################################################"
echo "> verify tmus signature on-chain"
RES=$(request "GET" '' http://$BSA_DTAG/signatures/$REFERENCE_ID/TMUS/verify)
echo $RES | jq 
VALID=$(echo $RES | jq -r .\"$TXID_TMUS\".valid)
if [ $VALID == "true" ]; then
    echo "SIGNATURE VALID!"
else
    echo "FAILED"
    exit 1
fi


echo "###################################################"
echo "> dtag signs contract with a bad signature (here: bad payload data)"
# do the signing
CERT=$(cat $DIR/intermediate_api.DTAG.crt $DIR/user.DTAG.crt)
SIGNATUREPAYLOAD="this_is_an_invalid_payload"
echo -e "> payload to sign <$SIGNATUREPAYLOAD>"
SIGNATURE_DTAG=$(echo -ne $SIGNATUREPAYLOAD | openssl dgst -sha256 -sign $DIR/user.DTAG.key | openssl base64 | tr -d '\n')
# call blockchain adapter
RES=$(request_noexit "PUT" '{"algorithm": "ecdsaWithSha256", "certificate" : "'"${CERT}"'", "signature" : "'$SIGNATURE_TMUS'" }'  http://$BSA_DTAG/signatures/$REFERENCE_ID)
#echo $RES
ERROR_CODE=$(echo $RES | jq -r .code)
ERROR_MESSAGE=$(echo $RES | jq -r .message)
if [ "$ERROR_CODE" != "ERROR_SIGNATURE_INVALID" ]; then
    echo "> ERROR: wrong error code, got '$ERROR_CODE'"
    exit 1
fi;
if [[ "$ERROR_MESSAGE" != signDocument* ]]; then
    echo "> ERROR: wrong error response, got '$ERROR_MESSAGE'"
    exit 1
fi;
echo "> looking good, bad signature (wrong cert) was sucessfully detected!"

echo "###################################################"
echo "> dtag signs contract with a BAD cert (missing ext)"
# do the signing
CERT=$(cat $DIR/intermediate_api.DTAG.crt $DIR/user.DTAG.bad.crt)
SIGNATUREPAYLOAD=$(payload "DTAG" "$REFERENCE_ID" "$PAYLOADLINK")
echo -e "> payload to sign <$SIGNATUREPAYLOAD>"
SIGNATURE_DTAG=$(echo -ne $SIGNATUREPAYLOAD | openssl dgst -sha256 -sign $DIR/user.DTAG.key | openssl base64 | tr -d '\n')
# call blockchain adapter
RES=$(request_noexit "PUT" '{"algorithm": "ecdsaWithSha256", "certificate" : "'"${CERT}"'", "signature" : "'$SIGNATURE_DTAG'" }'  http://$BSA_DTAG/signatures/$REFERENCE_ID)
#echo $RES
ERROR_CODE=$(echo $RES | jq -r .code)
ERROR_MESSAGE=$(echo $RES | jq -r .message)
if [ "$ERROR_CODE" != "ERROR_CERT_INVALID" ]; then
    echo "> ERROR: wrong error code, got '$ERROR_CODE'"
    exit 1
fi;
if [[ "$ERROR_MESSAGE" != signDocument* ]]; then
    echo "> ERROR: wrong error response, got '$ERROR_MESSAGE'"
    exit 1
fi;
echo "> looking good, bad signature (because of bad certificate) was sucessfully detected!"

revokeUserCertificate() {
    ORG=$1
    INTERMEDIATE=$2

    CERT=$DIR/user.$ORG.pem
    if [ "$INTERMEDIATE" -eq "1" ]; then
        INTERMEDIATE=$(cat $DIR/intermediate_api.$ORG.crt)
        ROLE=intermediate
    else
        INTERMEDIATE=""
        ROLE=root
    fi;

    # config for openssl
    mkdir $DIR/$ORG
    CONFIG=$DIR/$ORG/ca.conf
    SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
    sed "s|REPLACE_DIR|${DIR}\/${ORG}|; s|ROLE|${ROLE}|; s|ORG|${ORG}|" $SCRIPT_DIR/testing/config/ca.conf > $CONFIG
    echo 01 > $DIR/$ORG/serial.txt
    echo 01 > $DIR/$ORG/crlnumber
    # add certificate to database
    touch $DIR/$ORG/index.txt
    openssl ca -config $CONFIG -valid $CERT
    # revoke in database
    openssl ca -config $CONFIG -revoke $CERT -crl_compromise 20200101120000Z
    # create CRL
    openssl ca -config $CONFIG -gencrl -out $DIR/user.$ORG.crl.pem

    BSA_NAME=BSA_$ORG
    BSA=${!BSA_NAME}

    # post crl to chaincode
    RES=$(request POST '{"crl": "'"$(cat $DIR/user.$ORG.crl.pem | awk 1 ORS='\\n' )"'", "certificateList": "'"$INTERMEDIATE"'"}' http://$BSA/certificate/revoke)
    SUCCESS=$(echo $RES | jq -r .success)
    if [ $SUCCESS != "true" ]; then
        ERROR_CODE=$(echo $RES | jq -r .code)
        echo "> ERROR: could not upload CRL: '$ERROR_CODE'"
        exit 1
    fi

    TXID_NAME=TXID_$ORG
    TXID=${!TXID_NAME}

    # check if signature is deemed valid after revocation of certificate
    RES=$(request_noexit "GET" '' http://$BSA/signatures/$REFERENCE_ID/$ORG/verify)
    echo $RES | jq 
    VALID=$(echo $RES | jq -r .\"$TXID\".valid)
    if [ $VALID == "false" ]; then
        echo "SIGNATURE INVALID DUE TO REVOKED CERTIFICATE, SUCCESS!"
    else
        echo "SIGNATURE DEEMED VALID, FAILED!"
        exit 1
    fi;
}

echo "###################################################"
echo "> revoke certificate for DTAG user (revocation by intermediate)"
revokeUserCertificate DTAG 1


echo "###################################################"
echo "> revoke certificate for TMUS user (no intermediate certificate)"
revokeUserCertificate TMUS 0