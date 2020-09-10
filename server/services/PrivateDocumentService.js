const Service = require('./Service');
var { BlockchainService } = require('../hyperledger/blockchain_service');

/**
* Fetch a private document from the database
*
* hash String The document hash
* returns PrivateDocument
* */
const fetchPrivateDocument = ({ hash }) => new Promise(
  async (resolve, reject) => {
    const blockchain_connection = new BlockchainService(process.env.BSA_CCP);

    blockchain_connection.fetchPrivateDocument(hash)
      .then( document => {
        resolve(Service.successResponse(document, 200))
      }).catch(error => {
        console.log("ERROR: " + error)
        reject(Service.rejectResponse({"message" : error.toString()}, 500))
      }).finally( () => {
        blockchain_connection.disconnect()
      })
  },
);

/**
* Upload a private document
*
* privateDocument PrivateDocument A document that should be uploaded
* returns String
* */
const uploadPrivateDocument = ({ body }) => new Promise(
  async (resolve, reject) => {
    const blockchain_connection = new BlockchainService(process.env.BSA_CCP);
      
    blockchain_connection.addDocument(body["partner_msp"], body["document"])
      .then( hash => {
        var resJSON = {};
        resJSON['DataHash'] = hash;
        console.log("> both parties stored data with hash " + hash)
        resolve(Service.successResponse(resJSON, 200))
      }).catch(error => {
        console.log("ERROR: " + error)
        reject(Service.rejectResponse({"message" : error.toString()}, 500))
      }).finally( () => {
        blockchain_connection.disconnect()
      });
    },
);

module.exports = {
  fetchPrivateDocument,
  uploadPrivateDocument,
};
