// SPDX-FileCopyrightText: 2021 GSMA and all contributors.
//
// SPDX-License-Identifier: Apache-2.0
//
const Service = require('./Service');
const {BlockchainService} = require('../hyperledger/blockchain_service');

/** Update the signature root certificate for this organization
   * @param {Certificate} body - A PEM encoded root certificate
   * @return {string}
  */
 const setCertificateRoot = ({body}) => new Promise(
  async (resolve, reject) => {
    const blockchainConnection = new BlockchainService(process.env.BSA_CCP);
    console.dir(body);
    blockchainConnection.setCertificate('root', body).then( () => {
      resolve(Service.successResponse('OK', 200));
    }).catch((error) => {
      reject(Service.rejectResponse({'code': error.code, 'message': error.message}, 500));
    }).finally( () => {
      blockchainConnection.disconnect();
    });
  },
);

/**
* Upload a certificate revokation list (CRL)
*
* certificateRevocationList CertificateRevocationList Submit a certificate revocation list signed by a CA.
* returns String
* */
const submitCertificateRevocationList = ({ body }) => new Promise(
  async (resolve, reject) => {
    const blockchainConnection = new BlockchainService(process.env.BSA_CCP);
    console.dir(body);
    blockchainConnection.submitCRL(body['crl'], body['certificateList']).then( () => {
      resolve(Service.successResponse('OK', 200));
    }).catch((error) => {
      reject(Service.rejectResponse({'code': error.code, 'message': error.message}, 500));
    }).finally( () => {
      blockchainConnection.disconnect();
    });
  },
);

module.exports = {
  setCertificateRoot,
  submitCertificateRevocationList,
};
