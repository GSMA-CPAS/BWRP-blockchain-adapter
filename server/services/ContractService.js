// SPDX-FileCopyrightText: 2021 GSMA and all contributors.
//
// SPDX-License-Identifier: Apache-2.0
//
const Service = require('./Service');
const {BlockchainService} = require('../hyperledger/blockchain_service');

/** Fetch a private document from the database, identified by its referenceID
   * @param {string} referenceID - The referenceID of the document
   * @return {PrivateDocumentResponse}
  */
const fetchPrivateDocument = ({referenceID}) => new Promise(
    async (resolve, reject) => {
      const blockchainConnection = new BlockchainService(process.env.BSA_CCP);

      blockchainConnection.fetchPrivateDocument(referenceID)
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
* Delete a private document from the database, identified by its referenceID
*
* @param {string} referenceID - The referenceID of the document
* @return {string} - no response value expected for this operation
* */
const deletePrivateDocument = ({referenceID}) => new Promise(
    async (resolve, reject) => {
      const blockchainConnection = new BlockchainService(process.env.BSA_CCP);

      blockchainConnection.deletePrivateDocument(referenceID)
          .then( () => {
            resolve(Service.successResponse('', 200));
          }).catch((error) => {
            reject(Service.rejectResponse({'code': error.code, 'message': error.message}, 500));
          }).finally( () => {
            blockchainConnection.disconnect();
          });
    },
);

/** show a list of referenceIDs of the private documents
   * @return {String[]}
  */
const fetchPrivateDocumentReferenceIDs = () => new Promise(
    async (resolve, reject) => {
      const blockchainConnection = new BlockchainService(process.env.BSA_CCP);

      blockchainConnection.fetchPrivateDocumentReferenceIDs()
          .then( (documents) => {
            resolve(Service.successResponse(documents, 200));
          }).catch((error) => {
            reject(Service.rejectResponse({'code': error.code, 'message': error.message}, 500));
          }).finally( () => {
            blockchainConnection.disconnect();
          });
    },
);

/** Fetch all signatures for a given signer msp and a given document from the ledger
   * @param {string} referenceID - The referenceID of a document
   * @param {string} signerMSP - the MSP of the signer
   * @return {string}
  */
const fetchSignatures = ({referenceID, signerMSP}) => new Promise(
    async (resolve, reject) => {
      const blockchainConnection = new BlockchainService(process.env.BSA_CCP);

      blockchainConnection.fetchSignatures(signerMSP, referenceID)
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

      blockchainConnection.addDocument(body['toMSP'], body['payload'])
          .then( (responseJSON) => {
            const responseObject = JSON.parse(responseJSON)
            console.log('> both parties stored data with referenceID ' + responseObject.referenceID);
            resolve(Service.successResponse(responseJSON, 200));
          }).catch((error) => {
            reject(Service.rejectResponse({'code': error.code, 'message': error.message}, 500));
          }).finally( () => {
            blockchainConnection.disconnect();
          });
    },
);

/** Store a signature for the document identified by id on the ledger
   * @param {string} referenceID - The referenceID of the document
   * @param {DocumentSignature} body - a document signature that should be uploaded
   * @return {string}
  */
const uploadSignature = ({referenceID, body}) => new Promise(
    async (resolve, reject) => {
      const blockchainConnection = new BlockchainService(process.env.BSA_CCP);

      // for security reasons, rewrite the json here:
      const signature = {
        'algorithm': body['algorithm'],
        'certificate': body['certificate'],
        'signature': body['signature'],
        'contractCreator': body['contractCreator']
      };
      const signatureJSON = JSON.stringify(signature);

      blockchainConnection.signDocument(referenceID, signatureJSON)
          .then( (txID) => {
            const resJSON = {};
            resJSON['txID'] = txID;
            console.log('> stored signature with txID ' + txID);
            resolve(Service.successResponse(resJSON, 200));
          }).catch((error) => {
            reject(Service.rejectResponse({'code': error.code, 'message': error.message}, 500));
          }).finally( () => {
            blockchainConnection.disconnect();
          });
    },
);

/** verify the on chain signatures for a given document identified by its referenceID
   * @param {string} referenceID - The referenceID
   * @param {string} creator - The msp that initially created the document
   * @param {string} signer - The msp that signed
   * @return {string}
  */
const verifySignatures = ({referenceID, creator, signer}) => new Promise(
    async (resolve, reject) => {
      const blockchainConnection = new BlockchainService(process.env.BSA_CCP);

      blockchainConnection.verifySignatures(referenceID, creator, signer)
          .then( (response) => {
            resolve(Service.successResponse(response, 200));
          }).catch((error) => {
            reject(Service.rejectResponse({'code': error.code, 'message': error.message}, 500));
          }).finally( () => {
            blockchainConnection.disconnect();
          });
    },
);

/** Fetch the stored referencepayloadlink for a given reference id and creator
 * @param {string} referenceID - the referenceID
 * @param {string} creatorMSPID - the initial creator of the contract.
 * @return {string}
*/
const getReferencePayloadLink = ({referenceID, creatorMSPID}) => new Promise(
    async (resolve, reject) => {
      const blockchainConnection = new BlockchainService(process.env.BSA_CCP);

      blockchainConnection.getReferencePayloadLink(referenceID, creatorMSPID)
          .then( (response) => {
            resolve(Service.successResponse(response, 200));
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
  fetchPrivateDocumentReferenceIDs,
  fetchSignatures,
  uploadPrivateDocument,
  uploadSignature,
  verifySignatures,
  getReferencePayloadLink,
};
