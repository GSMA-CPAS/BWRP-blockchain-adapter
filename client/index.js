console.log("starting example-client")
var api = require('blockchain-adapter-api')

const ENDPOINT= "http://127.0.0.1:8081"

var myAPI = new api.FetchSignaturesApi(ENDPOINT)
var myoffchainconfig = new api.OffchainDbAdapterConfigApi(ENDPOINT)


myAPI.fetchSignatures("0000000000000000000000000000000000000000000000000000000000000000", "MSPID").then(res => {
    console.log(res)
})