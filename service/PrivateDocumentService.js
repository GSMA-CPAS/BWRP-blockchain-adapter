'use strict';

var { BlockchainService } = require('../hyperledger/blockchain_service');

/**
 * Manage private documents
 * Upload a private document
 *
 * body PrivateDocument A document that should be uploaded
 * returns String
 **/
exports.uploadPrivateDocument = function(body) {
  return new Promise(function(resolve, reject) {
    const blockchain_connection = new BlockchainService(process.env.BSA_CCP);

    if (body.partner_msp == undefined) {
      reject({"message" : "missing field partner_msp"})
      return
    }

    if (body.document == undefined) {
      reject({"message" : "missing field document"})
      return
    }
    
    blockchain_connection.addDocument(body["partner_msp"], body["document"])
      .then( hash => {
        var resJSON = {};
        resJSON['DataHash'] = hash;
        console.log("> stored data with hash " + hash)
        resolve(resJSON);})
      .catch(error => {
        console.log("ERROR: " + error)
        reject({"message" : error.toString()})
      }).finally( () => {
        blockchain_connection.disconnect()
      });
  });
}

