'use strict';
var { BlockchainService } = require('../hyperledger/blockchain_service');

/**
 * Update the configuration of the offchain-db-adapter
 *
 * body OffchainDBAdapterConfig A configuration for the offchain-db-adapter
 * returns String
 **/
exports.setOffchainDBAdapterConfig = function(body) {
  return new Promise(function(resolve, reject) {
    const blockchain_connection = new BlockchainService(process.env.BSA_CCP);

    if (body.rest_uri == undefined) {
      reject({"message" : "missing field rest_uri"})
      return
    }

    blockchain_connection.setRESTConfig(body.rest_uri)
      .then( txID => {
        var resJSON = {};
        resJSON['txID'] = txID;
        console.log("> stored data with txID " + txID)
        resolve(resJSON);})
      .catch(error => {
        console.log("ERROR: " + error)
        reject({"message" : error.toString()})
      })
      .finally( () => {
        blockchain_connection.disconnect()
      });
  });
}
