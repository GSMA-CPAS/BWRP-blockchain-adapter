'use strict';

var hlf = require('../hyperledger/blockchain_service');

/**
 * Update the configuration of the offchain-db-adapter
 *
 * body OffchainDBAdapterConfig A configuration for the offchain-db-adapter
 * no response value expected for this operation
 **/
exports.setOffchainDBAdapterConfig = function(body) {
  return new Promise(function(resolve, reject) {
    hlf.blockchain_connection.setRESTConfig(body.rest_uri)
      .then( txID => {
        var resJSON = {};
        resJSON['txID'] = txID;
        console.log("> stored data with txID " + txID)
        resolve(resJSON);})
      .catch(error => {
        console.log("ERROR: " + error)
        reject({"message" : error.toString()})
      });
  });
}

