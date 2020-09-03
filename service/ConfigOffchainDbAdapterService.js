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
    return hlf.blockchain_connection.setRESTConfig(body.rest_uri).then( hash => {
      var resJSON = {};
      resJSON['DataHash'] = hash;
      console.log("> stored data with hash " + hash)
      resolve(resJSON);
    });
  });
}

