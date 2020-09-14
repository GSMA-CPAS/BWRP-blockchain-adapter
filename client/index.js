console.log("starting example-client")
var api = require('blockchain-adapter-api')
var btoa = require('btoa')
var crypto = require('crypto');
const { exit } = require('process');
const _ = require('lodash');
const fs = require('fs');

const openssl = require('openssl-nodejs')
//the strange openssl lib needs this dir in order to work
fs.mkdir("openssl", { recursive: true }, (err) => {
    if (err) throw err;
});


const ENDPOINT_DTAG = "http://localhost:8081"
const ENDPOINT_TMUS = "http://localhost:8082"

// create a unique document:
// WARNING: btoa() does not seem to work reliable on real binary documents!
const DOCUMENT = (new Date().getTime()).toString() //"test"
const DOCUMENT64 = btoa(DOCUMENT)

console.log(DOCUMENT)
console.log(DOCUMENT64)
const DOCUMENTSHA256 = crypto.createHash('sha256').update(DOCUMENT64).digest('hex');
console.log("DOCUMENT: " + DOCUMENT+", DOCUMENT64: " + DOCUMENT64+", DOCUMENTSHA256: " + DOCUMENTSHA256)


function setOffchainDBAdapterConfig (config, name, uri) {
    console.log("> " + name + ": setting offchain db adapter config uri to " + uri)
    const obdaConfig = new api.OffchainDBAdapterConfig()
    obdaConfig.restURI = uri
    return config.setOffchainDBAdapterConfig(obdaConfig).then( result => {
        console.log("> ok. txID = " + result.body.txID)
    }).catch( e => {
        console.log("> failed, response body: " + JSON.stringify(e.response.body))
        exit(1)
    })
}

function signContract(signer, document) {
    
    return new Promise((resolve, reject) => {
        var document_sig = new api.DocumentSignature()
        document_sig.signer = signer
        
        // create key
        openssl("openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:secp384r1 -nodes -keyout key_"+signer+" -out crt -subj /CN="+signer+"/C=DE/ST=NRW/L=Bielefeld/O=ORG/OU=ORGOU -addext keyUsage=digitalSignature", function(e, b){
            //
        }).on('close', (code) => { 
            if (code != 0) reject("openssl: failed to create key")
        })

        // extract pem
        var pembuf = Buffer.alloc(0)
        openssl(['x509', '-pubkey', '-in', 'crt'], function(e,b){
            if ((e) && (e != "")) reject(e.toString())

            document_sig.pem = b.toString()
            var signature = ""
            var docBuf = Buffer.from(document)
            var sigBuf = Buffer.alloc(0)
            console.log("> DOC <"+document+">")
            openssl(['dgst', '-sha256', '-sign', 'openssl/key_'+signer, '-out',  { name: "signature_"+signer, buffer: sigBuf}, { name: "doc", buffer: docBuf}], function(e,sig_bin){
                if ((e) && (e != "")) reject(e.toString())
                // do base64 encoding
                openssl(['enc', '-A', '-base64', '-in', 'signature_' + signer], function(e,b){
                    if ((e) && (e != "")) reject(e.toString())
                    document_sig.signature = b.toString()
                    resolve(document_sig)
                }).on('close', (code) => { 
                    if (code != 0) reject("openssl: failed to calc base64")
                })
            }).on('close', (code) => { 
                if (code != 0) reject("openssl: failed to sign")
            })
        }).on('close', (code) => { 
            if (code != 0) reject("openssl: failed to extract pem")
        });
    })
}


function verifySignature(document, pem, signature64) {
    console.log("document: " + document+".")
    console.log("pem: " + pem)
    console.log("signature64: " + signature64)
    
    return new Promise((resolve, reject) => {
        var docBuf = Buffer.from(document)
        var pemBuf = Buffer.from(pem)
        var sigBuf = Buffer.from(signature64)


        openssl(['enc', '-d', '-A', '-base64', '-in', { name: 'signature_sig64', buffer: sigBuf}, '-out', 'signature_sig'], function(e,b){
            if ((e) && (e != "")) reject(e.toString())

            openssl(['dgst', '-sha256', '-verify', { name: "signature_pem", buffer: pemBuf }, '-signature', 'openssl/signature_sig', { name: "signature_doc", buffer: docBuf }], function(e,b){
                if ((e) && (e != "")) reject(e.toString())

                resolve( b.toString() )
            }).on('close', (code) => {
                 if (code != 0) reject("openssl: failed to verify signature")
            })
        }).on('close', (code) => { 
            if (code != 0) reject("openssl: failed to calc base64")
        })
    })
}

const launchClient = async () => {

    var DTAG = {
        config   : new api.ConfigApi(ENDPOINT_DTAG),
        contract : new api.ContractApi(ENDPOINT_DTAG)
    }
    var TMUS = {
        config   : new api.ConfigApi(ENDPOINT_TMUS),
        contract : new api.ContractApi(ENDPOINT_TMUS)
    }
    
    try {
        console.log("> configuring offchain-db-adapter uris")
        //await setOffchainDBAdapterConfig(DTAG.config, "DTAG", "http://offchain-db-adapter-dtag:3333")
        //await setOffchainDBAdapterConfig(TMUS.config, "TMUS", "http://offchain-db-adapter-tmus:3334")
        
        console.log("> storing document on both parties by calling the function on DTAG with the partner id TMUS")
        priv_document = new api.PrivateDocument()
        priv_document.toMSP = "TMUS"
        priv_document.data = DOCUMENT64
        await DTAG.contract.uploadPrivateDocument(priv_document).then( res => {
            console.log("> done. stored #"+res.response.body.DataHash)
        })
        
        console.log("> dtag signs contract")
        var document_sig = await signContract("user@dtag", DOCUMENT64)
        await DTAG.contract.uploadSignature(DOCUMENTSHA256, document_sig).then( res => {
            console.log("> done. txid " + res.response.body.txID)
        })
        
        console.log("> tmus signs contract")
        var document_sig = await signContract("user@tmus", DOCUMENT64)
        await TMUS.contract.uploadSignature(DOCUMENTSHA256, document_sig).then( res => {
            console.log("> done. txid " + res.response.body.txID)
        })

        console.log("> fetching document from dtag")
        var res = await DTAG.contract.fetchPrivateDocument(DOCUMENTSHA256)
        var doc = res.body
        console.log("> " + doc.timestamp + ": " + doc.fromMSP + " -> " + doc.toMSP + ", document data b64 = " + doc.dataHash)

        console.log("> fetching tmus signatures")
        var res = await DTAG.contract.fetchSignatures(DOCUMENTSHA256, "TMUS")
        var sig = res.body

        _.each(sig, function (entry, key) {
            console.log("> verifying signature[" + key + "] = " + entry.signature)    
            verifySignature(doc.data, entry.pem, entry.signature).then ( result => {
                console.log("> result: " + result)
            }).catch( (x) => {
                console.log(" FAILED: " + x)
            })
        });
        
    } catch (err) {
        if ((err.body) && (err.body.message)) {
            console.log(err.body.message)
        } else {
            console.error("ERROR: >" + err + "<")
        }
    }

}

launchClient().catch(e => console.log(e));