const Service = require('./Service');

var { BlockchainService } = require('../hyperledger/blockchain_service');

/**
* fetch all signatures for a given msp and a given document hash from the ledger
*
* hash String The document hash
* msp String A MSP name
* returns String
* */
const fetchSignatures = ({ hash, msp }) => new Promise(
  
);

module.exports = {
  fetchSignatures,
};
