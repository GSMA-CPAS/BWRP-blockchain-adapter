'use strict';
var { BlockchainService } = require('../hyperledger/blockchain_service');


/**
 * store a signature for a given document on the ledger
 *
 * body DocumentSignature a document signature that should be uploaded
 * returns String
 **/
exports.uploadSignature = function(body) {
  return new Promise(function(resolve, reject) {
    const blockchain_connection = new BlockchainService(process.env.BSA_CCP);

    if (body.document == undefined) {
      reject({"message" : "missing field document"})
      return
    }
    
    if (body.signature == undefined) {
      reject({"message" : "missing field signature"})
      return
    }

    if (body.signer == undefined) {
      reject({"message" : "missing field signer"})
      return
    }
    
    if (body.pem == undefined) {
      reject({"message" : "missing field pem"})
      return
    }

    blockchain_connection.signDocument(body["document"], body["signature"], body["signer"], body["pem"])
      .then( hash => {
        console.log(hash)
        /*var resJSON = {};
        resJSON['txID'] = hash;
        console.log("> stored data with txID " + hash)
        resolve(resJSON)*/
        ;})
      .catch(error => {
        console.log("ERROR: " + error)
        reject({"message" : error.toString()})
      }).finally( () => {
        blockchain_connection.disconnect()
      });
  });
}

