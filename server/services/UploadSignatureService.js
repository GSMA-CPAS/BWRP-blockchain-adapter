const Service = require('./Service');
var { BlockchainService } = require('../hyperledger/blockchain_service');

/**
* store a signature for a given document on the ledger
*
* documentSignature DocumentSignature a document signature that should be uploaded
* returns String
* */
const uploadSignature = ({ body }) => new Promise(
  async (resolve, reject) => {
    const blockchain_connection = new BlockchainService(process.env.BSA_CCP);

    blockchain_connection.signDocument(body["document"], body["signature"], body["signer"], body["pem"])
      .then( txID => {
        var resJSON = {};
        resJSON['txID'] = txID;
        console.log("> stored signature with txID " + txID)
        resolve(Service.successResponse(resJSON, 200))
      ;}).catch(error => {
        console.log("ERROR: " + error)
        reject(Service.rejectResponse({"message" : error.toString()}, 500))
      }).finally( () => {
        blockchain_connection.disconnect()
      });
  },
);

module.exports = {
  uploadSignature,
};
