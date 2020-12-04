/**
 * Copyright 2018, 2019 IBM All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

// based on https://raw.githubusercontent.com/hyperledger/fabric-sdk-node/master/test/ts-scenario/config/handlers/sample-query-handler.ts
const {ErrorCode} = require('../utils/errorcode');

/** Query handler implementation
 */
class SingleMSPQueryHandler {
  /** Constructor
  * @param {Network} network - a fabric network object
  */
  constructor(network) {
    this.network = network;
    this.channel = this.network.getChannel();
    // disable filter for now
    this.setFilter('');
  }

  /** set query filter
  * @param {string} mspID - filter for this msp
  */
  setFilter(mspID) {
    console.log('> setting MSP filter to <'+mspID+'>');
    this.peers = this.channel.getEndorsers(mspID);
  }

  /** set query filter
  * @param {Query} query - a query
  */
  async evaluate(query) {
    console.log('> evaluate will be executed on peers <' + this.peers + '>');

    for (const peer of this.peers) {
      const results = await query.evaluate([peer]);
      const result = results[peer.name];
      if (result instanceof Error) {
        // for now return the very first error
        console.log(result.toString());
        throw new ErrorCode('ERROR_INTERNAL', result.toString());
      } else {
        if (result.isEndorsed) {
          return result.payload;
        } else {
          // for now return the very first error
          console.log('ERROR: ' + peer.name + ': ' + result.message + '\n');
          throw new ErrorCode('ERROR_INTERNAL', result.message);
        }
      }
    }

    throw new ErrorCode('ERROR_INTERNAL', 'got no evalute results from peers');
  }
}

/**
 * Factory function for creating sample query handlers.
 * @param {Network} network The network where transactions are to be evaluated.
 * @return {QueryHandler} A query handler implementation.
 */
function createSingleMSPQueryHandler(network) {
  return new SingleMSPQueryHandler(network);
};

module.exports = {SingleMSPQueryHandler, createSingleMSPQueryHandler};
