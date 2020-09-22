const Service = require('./Service');
var { BlockchainService } = require('../hyperledger/blockchain_service');
var Webhook = require('../webhook/service');

const webhookService = new Webhook('signature_data');

// set up listener for contract events
const blockchainConnection = new BlockchainService(process.env.BSA_CCP);
blockchainConnection.subscribeSignatureEvents(function(val){ webhookService.processEvent(val); });

/**
* Fetch a private document from the database, identified by its id
*
* id String The document ID
* returns PrivateDocumentResponse
* */
const fetchPrivateDocument = ({ id }) => new Promise(
  async (resolve, reject) => {
    const blockchainConnection = new BlockchainService(process.env.BSA_CCP);

    blockchainConnection.fetchPrivateDocument(id)
      .then( document => {
        resolve(Service.successResponse(document, 200))
      }).catch(error => {
        console.log("ERROR: " + error)
        reject(Service.rejectResponse({"message" : error.toString()}, 500))
      }).finally( () => {
        blockchainConnection.disconnect()
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
    const blockchainConnection = new BlockchainService(process.env.BSA_CCP);

    blockchainConnection.fetchSignatures(msp, id)
      .then( signatures => {
        resolve(Service.successResponse(signatures, 200))
      }).catch(error => {
        console.log("ERROR: " + error)
        reject(Service.rejectResponse( {"message" : error.toString()}, 500))
      }).finally( () => {
        blockchainConnection.disconnect()
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
    const blockchainConnection = new BlockchainService(process.env.BSA_CCP);
    
    blockchainConnection.addDocument(body["toMSP"], body["data"])
      .then( documentID => {
        var resJSON = {};
        resJSON['documentID'] = documentID;
        console.log("> both parties stored data with ID " + documentID)
        resolve(Service.successResponse(resJSON, 200))
      }).catch(error => {
        console.log("ERROR: " + error)
        reject(Service.rejectResponse({"message" : error.toString()}, 500))
      }).finally( () => {
        blockchainConnection.disconnect()
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
    const blockchainConnection = new BlockchainService(process.env.BSA_CCP);

    // for security reasons, rewrite the json here:
    const signature = {
      "algorithm" : body["algorithm"],
      "certificate" : body["certificate"],
      "signature" : body["signature"],
    }
    const signatureJSON = JSON.stringify(signature);

    blockchainConnection.signDocument(id, signatureJSON)
      .then( txID => {
        var resJSON = {};
        resJSON['txID'] = txID;
        console.log("> stored signature with txID " + txID)
        resolve(Service.successResponse(resJSON, 200))
      ;}).catch(error => {
        console.log("ERROR: " + error)
        reject(Service.rejectResponse({"message" : error.toString()}, 500))
      }).finally( () => {
        blockchainConnection.disconnect()
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
    webhookService.addSubscription(callbackUrl).then ( (uuid) => {
      resolve(Service.successResponse(uuid, 201))
    }, (error) => {
      reject(Service.rejectResponse({"message" : error.toString()}, 500))
    });
  },
);

module.exports = {
  fetchPrivateDocument,
  fetchSignatures,
  signaturesSubscribePOST,
  uploadPrivateDocument,
  uploadSignature,
};
