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
  async (resolve, reject) => {
    const blockchain_connection = new BlockchainService(process.env.BSA_CCP);

    blockchain_connection.fetchSignatures(hash, msp)
      .then( signatures => {
        resolve(Service.successResponse(signatures, 200))
      }).catch(error => {
        console.log("ERROR: " + error)
        reject(Service.rejectResponse( {"message" : error.toString()}, 500))
      }).finally( () => {
        blockchain_connection.disconnect()
      });
  },
);

module.exports = {
  fetchSignatures,
};
