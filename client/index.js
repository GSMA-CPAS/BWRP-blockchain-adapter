console.log("starting example-client")
var api = require('blockchain-adapter-api')
var btoa = require('btoa');
var crypto = require('crypto');
const { exit } = require('process');

const launchClient = async () => {

    const ENDPOINT_DTAG = "http://127.0.0.1:8081"
    const ENDPOINT_TMUS = "http://127.0.0.1:8082"

    var configAPIDTAG = new api.ConfigApi(ENDPOINT_DTAG)
    var contractAPIDTAG = new api.ContractApi(ENDPOINT_DTAG)
    var configAPITMUS = new api.ConfigApi(ENDPOINT_TMUS)
    var contractAPITMUS = new api.ContractApi(ENDPOINT_TMUS)

    configDTAG = new api.OffchainDBAdapterConfig()
    configDTAG.restURI = "http://offchain-db-adapter-dtag:3333"
    configTMUS = new api.OffchainDBAdapterConfig()
    configTMUS.restURI = "http://offchain-db-adapter-tmus:3334"

    try {
        console.log("Configuring Endpoints: " + configDTAG.restURI, ", " + configTMUS.restURI)

        res = await configAPIDTAG.setOffchainDBAdapterConfig(configDTAG)
        console.log("> setting rest uri on dtag: "+res.response.statusMessage)

        res = await configAPITMUS.setOffchainDBAdapterConfig(configTMUS)
        console.log("> setting rest uri on tmus: "+res.response.statusMessage)

        //DOCUMENT="MYDOCUMENT_DATA_123456..."
        // create a unique document:
        const DOCUMENT = new Date().getTime() //"test"
        const DOCUMENT64 = btoa(DOCUMENT)
        const DOCUMENTSHA256 = crypto.createHash('sha256').update(DOCUMENT64).digest('hex');
        console.log("DOCUMENT: " + DOCUMENT+", DOCUMENT64: " + DOCUMENT64+", DOCUMENTSHA256: " + DOCUMENTSHA256)

        priv_document = new api.PrivateDocument()
        priv_document.toMSP = "TMUS"
        priv_document.data = DOCUMENT64
        res = await contractAPIDTAG.uploadPrivateDocument(priv_document)
        console.log("> storing document on both parties with hash: "+res.response.body.DataHash)

        document_sig = new api.DocumentSignature()
        document_sig.signer = "mydtaguser1"
        document_sig.pem = "mydtaguser1pem"
        document_sig.signature = "mydtaguser1sig"
        res = await contractAPIDTAG.uploadSignature(DOCUMENTSHA256, document_sig)
        console.log("> dtag signs contract, resulting in txid: "+res.response.body.txID)

        document_sig = new api.DocumentSignature()
        document_sig.signer = "mytmususer1"
        document_sig.pem = "mytmususer1pem"
        document_sig.signature = "mytmususer1sig"
        res = await contractAPITMUS.uploadSignature(DOCUMENTSHA256, document_sig)
        console.log("> tmus signs contract, resulting in txid: "+res.response.body.txID)

        console.log("> fetching document from dtag")
        res = await contractAPIDTAG.fetchPrivateDocument(DOCUMENTSHA256)
        console.log("> document: ",res.body)

        console.log("> fetching document from tmus")
        res = await contractAPITMUS.fetchPrivateDocument(DOCUMENTSHA256)
        console.log("> document: ",res.body)


        res = await contractAPITMUS.fetchSignatures(DOCUMENTSHA256, "DTAG")
        console.log(res.response.body)
    } catch (err) {
        console.error(err)
    }

}

launchClient().catch(e => logger.error(e));