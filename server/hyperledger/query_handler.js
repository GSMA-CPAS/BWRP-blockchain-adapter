/**
 * Copyright 2018, 2019 IBM All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

// based on https://raw.githubusercontent.com/hyperledger/fabric-sdk-node/master/test/ts-scenario/config/handlers/sample-query-handler.ts

const util = require('util');

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

    const errorMessages = [];

    for (const peer of this.peers) {
      const results = await query.evaluate([peer]);
      const result = results[peer.name];
      if (result instanceof Error) {
        errorMessages.push(result.toString());
      } else {
        if (result.isEndorsed) {
          return result.payload;
        }
        throw new Error(result.message);
      }
    }

    const message = util.format('Query failed. Errors: %j', errorMessages);
    throw new Error(message);
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
