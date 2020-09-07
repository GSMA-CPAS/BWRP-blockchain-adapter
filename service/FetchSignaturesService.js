'use strict';
var { BlockchainService } = require('../hyperledger/blockchain_service');


/**
 * fetch all signatures for a given msp and a given document hash from the ledger
 *
 * hash String The document hash
 * msp String A MSP name
 * returns String
 **/
exports.fetchSignatures = function(hash,msp) {
  return new Promise(function(resolve, reject) {
    const blockchain_connection = new BlockchainService(process.env.BSA_CCP);

    blockchain_connection.fetchSignatures(hash, msp)
      .then( signatures => {
        resolve(signatures)
      ;})

      .catch(error => {
        console.log("ERROR: " + error)
        reject({"message" : error.toString()})
      }).finally( () => {
        blockchain_connection.disconnect()
      });
  });

  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = "";
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}

