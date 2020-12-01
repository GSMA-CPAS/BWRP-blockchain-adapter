const Service = require('./Service');
const {BlockchainService} = require('../hyperledger/blockchain_service');

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
            reject(Service.rejectResponse({'code': error.code, 'message': error.message}, 500));
          }).finally( () => {
            blockchainConnection.disconnect();
          });
    },
);

/**
* Delete a private document from the database, identified by its id
*
* @param {string} id - The document ID
* @return {string} - no response value expected for this operation
* */
const deletePrivateDocument = ({id}) => new Promise(
    async (resolve, reject) => {
      const blockchainConnection = new BlockchainService(process.env.BSA_CCP);

      blockchainConnection.deletePrivateDocument(id)
          .then( () => {
            resolve(Service.successResponse('', 200));
          }).catch((error) => {
            reject(Service.rejectResponse({'code': error.code, 'message': error.message}, 500));
          }).finally( () => {
            blockchainConnection.disconnect();
          });
    },
);

/** show last n private documents
   * @return {String[]}
  */
const fetchPrivateDocumentIDs = () => new Promise(
    async (resolve, reject) => {
      const blockchainConnection = new BlockchainService(process.env.BSA_CCP);

      blockchainConnection.fetchPrivateDocumentIDs()
          .then( (documents) => {
            resolve(Service.successResponse(documents, 200));
          }).catch((error) => {
            reject(Service.rejectResponse({'code': error.code, 'message': error.message}, 500));
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
            reject(Service.rejectResponse({'code': error.code, 'message': error.message}, 500));
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
          .then( (responseJSON) => {
            console.log('> both parties stored data with ID ' + responseJSON.documentID);
            resolve(Service.successResponse(responseJSON, 200));
          }).catch((error) => {
            reject(Service.rejectResponse({'code': error.code, 'message': error.message}, 500));
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
            reject(Service.rejectResponse({'code': error.code, 'message': error.message}, 500));
          }).finally( () => {
            blockchainConnection.disconnect();
          });
    },
);

module.exports = {
  fetchPrivateDocument,
  deletePrivateDocument,
  fetchPrivateDocumentIDs,
  fetchSignatures,
  uploadPrivateDocument,
  uploadSignature,
};
