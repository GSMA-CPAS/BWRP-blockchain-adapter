const Service = require('./Service');
const {BlockchainService} = require('../hyperledger/blockchain_service');
const Webhook = require('../webhook/service');

const webhookService = new Webhook('signature_data');

// set up listener for contract events
const blockchainConnection = new BlockchainService(process.env.BSA_CCP);
blockchainConnection.subscribeLedgerEvents(function(val) {
  webhookService.processEvent(val);
});

/** Fetch a private document from the database, identified by its id
   * @param {string} id - The document ID
   * @return {PrivateDocumentResponse}
  */
const fetchPrivateDocument = ({id}) => new Promise(
    async (resolve, reject) => {
      const blockchainConnection = new BlockchainService(process.env.BSA_CCP);

      blockchainConnection.fetchPrivateDocument(id)
          .then( (document) => {
            resolve(Service.successResponse(document, 200));
          }).catch((error) => {
            console.log('ERROR: ' + error);
            reject(Service.rejectResponse({'message': error.toString()}, 500));
          }).finally( () => {
            blockchainConnection.disconnect();
          });
    },
);

/** Fetch all signatures for a given msp and a given document id from the ledger
   * @param {string} id - The document ID
   * @param {string} msp - A MSP name
   * @return {string}
  */
const fetchSignatures = ({id, msp}) => new Promise(
    async (resolve, reject) => {
      const blockchainConnection = new BlockchainService(process.env.BSA_CCP);

      blockchainConnection.fetchSignatures(msp, id)
          .then( (signatures) => {
            resolve(Service.successResponse(signatures, 200));
          }).catch((error) => {
            console.log('ERROR: ' + error);
            reject(Service.rejectResponse( {'message': error.toString()}, 500));
          }).finally( () => {
            blockchainConnection.disconnect();
          });
    },
);

/** Upload a private document, shared between our own organization and a partner MSP
   * @param {PrivateDocument} body - A document that should be uploaded
   * @return {string}
  */
const uploadPrivateDocument = ({body}) => new Promise(
    async (resolve, reject) => {
      const blockchainConnection = new BlockchainService(process.env.BSA_CCP);

      blockchainConnection.addDocument(body['toMSP'], body['data'])
          .then( (documentID) => {
            const resJSON = {};
            resJSON['documentID'] = documentID;
            console.log('> both parties stored data with ID ' + documentID);
            resolve(Service.successResponse(resJSON, 200));
          }).catch((error) => {
            console.log('ERROR: ' + error);
            reject(Service.rejectResponse({'message': error.toString()}, 500));
          }).finally( () => {
            blockchainConnection.disconnect();
          });
    },
);

/** Store a signature for the document identified by id on the ledger
   * @param {string} id - The document ID
   * @param {DocumentSignature} body - a document signature that should be uploaded
   * @return {string}
  */
const uploadSignature = ({id, body}) => new Promise(
    async (resolve, reject) => {
      const blockchainConnection = new BlockchainService(process.env.BSA_CCP);

      // for security reasons, rewrite the json here:
      const signature = {
        'algorithm': body['algorithm'],
        'certificate': body['certificate'],
        'signature': body['signature'],
      };
      const signatureJSON = JSON.stringify(signature);

      blockchainConnection.signDocument(id, signatureJSON)
          .then( (txID) => {
            const resJSON = {};
            resJSON['txID'] = txID;
            console.log('> stored signature with txID ' + txID);
            resolve(Service.successResponse(resJSON, 200))
            ;
          }).catch((error) => {
            console.log('ERROR: ' + error);
            reject(Service.rejectResponse({'message': error.toString()}, 500));
          }).finally( () => {
            blockchainConnection.disconnect();
          });
    },
);

/** Subscribes a client to receive new signature events
   * @param {URI} callbackUrl - the location where data will be sent
   * @return {object}
  */
const signaturesSubscribePOST = ({callbackUrl}) => new Promise(
    async (resolve, reject) => {
      webhookService.addSubscription(callbackUrl).then( (uuid) => {
        resolve(Service.successResponse(uuid, 201));
      }, (error) => {
        reject(Service.rejectResponse({'message': error.toString()}, 500));
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
