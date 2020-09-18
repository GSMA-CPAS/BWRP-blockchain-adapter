const Service = require('./Service');
var { BlockchainService } = require('../hyperledger/blockchain_service');

/**
* Fetch a private document from the database, identified by its id
*
* id String The document ID
* returns PrivateDocumentResponse
* */
const fetchPrivateDocument = ({ id }) => new Promise(
  async (resolve, reject) => {
    const blockchain_connection = new BlockchainService(process.env.BSA_CCP);

    blockchain_connection.fetchPrivateDocument(id)
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
* fetch all signatures for a given msp and a given document id from the ledger
*
* id String The document ID
* msp String A MSP name
* returns String
* */
const fetchSignatures = ({ id, msp }) => new Promise(
  async (resolve, reject) => {
    const blockchain_connection = new BlockchainService(process.env.BSA_CCP);

    blockchain_connection.fetchSignatures(msp, id)
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
* Upload a private document, shared between our own organization and a partner MSP
*
* body PrivateDocument A document that should be uploaded
* returns String
* */
const uploadPrivateDocument = ({ body }) => new Promise(
  async (resolve, reject) => {
    const blockchain_connection = new BlockchainService(process.env.BSA_CCP);
    
    blockchain_connection.addDocument(body["toMSP"], body["data"])
      .then( documentID => {
        var resJSON = {};
        resJSON['documentID'] = documentID;
        console.log("> both parties stored data with ID " + documentID)
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
* store a signature for the document identified by id on the ledger
*
* id String The document ID
* body DocumentSignature a document signature that should be uploaded
* returns String
* */
const uploadSignature = ({ id, body }) => new Promise(
  async (resolve, reject) => {
    const blockchain_connection = new BlockchainService(process.env.BSA_CCP);

    // for security reasons, rewrite the json here:
    const signatureJSON = {
      "algorithm" : body["algorithm"],
      "certificate" : body["certificate"],
      "signature" : body["signature"],
    }

    blockchain_connection.signDocument(id, signatureJSON)
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
