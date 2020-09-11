console.log("starting example-client")
var api = require('blockchain-adapter-api')
var btoa = require('btoa');
var crypto = require('crypto');
const { exit } = require('process');
const openssl = require('openssl-nodejs')
const _ = require('lodash');

const ENDPOINT_DTAG = "http://localhost:8081"
const ENDPOINT_TMUS = "http://localhost:8082"

//DOCUMENT="MYDOCUMENT_DATA_123456..."
// create a unique document:
const DOCUMENT = new Date().getTime() //"test"
const DOCUMENT64 = btoa(DOCUMENT)
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
        openssl("openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:secp384r1 -nodes -keyout key -out crt -subj /CN="+signer+"/C=DE/ST=NRW/L=Bielefeld/O=ORG/OU=ORGOU -addext keyUsage=digitalSignature", function(err, b){
            //console.log(err.toString())
        }).on('close', (code) => { if (code != 0) throw("openssl failed")})
    
        // extract pem
        var pembuf = Buffer.alloc(0)
        openssl(['x509', '-pubkey', '-in', 'crt'], function(e,b){
            document_sig.pem = b.toString()
            var signature = ""
            var docbuf = Buffer.from(document)
            openssl(['dgst', '-sha256', '-sign', 'openssl/key', { name: "doc", buffer: docbuf}], function(e,b){
                document_sig.signature = btoa(b)
                resolve(document_sig)
            }).on('close', (code) => { if (code != 0) throw("openssl failed")})
        }).on('close', (code) => { if (code != 0) throw("openssl failed")});
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

        _.each(sig, function (value, key) {
            console.log("> verifying signature[" + key + "] = " + value.signature)    
            //TODO openssl("openssl dgst -sha256 -verify openssl$PUB_TMUS -signature /dev/stdin $DOC
            console.log("TODO!")
        });
        
    } catch (err) {
        console.error(err)
    }

}

launchClient().catch(e => logger.error(e));