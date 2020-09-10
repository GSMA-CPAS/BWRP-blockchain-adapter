/**
 * Copyright 2018, 2019 IBM All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

// based on https://raw.githubusercontent.com/hyperledger/fabric-sdk-node/master/test/ts-scenario/config/handlers/sample-query-handler.ts

const { QueryHandler, QueryHandlerFactory, Query, QueryResults } = require('fabric-network');
const { Endorser } = require('fabric-common');
const util = require('util');

/**
 * Query handler implementation 
 */
class SingleMSPQueryHandler {
	constructor(network) {
		this.network = network
		this.channel = this.network.getChannel();
		// disable filter for now
		this.setFilter("")
	}
	
	setFilter(mspID) {
		console.log("> setting MSP filter to <"+mspID+">");
		this.peers = this.channel.getEndorsers(mspID);
    }
    
	async evaluate(query){
		console.log("> evaluate will be executed on peers <" + this.peers + ">");

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
 * @returns {QueryHandler} A query handler implementation.
 */
function createSingleMSPQueryHandler(network) {
	return new SingleMSPQueryHandler(network);
};

module.exports = { SingleMSPQueryHandler, createSingleMSPQueryHandler};