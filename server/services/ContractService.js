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

/**
* Upload a private document
*
* body PrivateDocument A document that should be uploaded
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
/**
* store a signature for the document identified by hash on the ledger
*
* hash String The document hash
* body DocumentSignature a document signature that should be uploaded
* returns String
* */
const uploadSignature = ({ hash, body }) => new Promise(
  async (resolve, reject) => {
    const blockchain_connection = new BlockchainService(process.env.BSA_CCP);

    blockchain_connection.signDocument(hash, body["signature"], body["signer"], body["pem"])
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

/**
* subscribes a client to receive new signature events
*
* callbackUrl URI the location where data will be sent
* returns Object
* */
const signaturesSubscribePOST = ({ callbackUrl }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        callbackUrl,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);


module.exports = {
  fetchPrivateDocument,
  fetchSignatures,
  signaturesSubscribePOST,
  uploadPrivateDocument,
  uploadSignature,
};
