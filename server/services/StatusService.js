// SPDX-FileCopyrightText: 2021 GSMA and all contributors.
//
// SPDX-License-Identifier: Apache-2.0
//
/* eslint-disable no-unused-vars */
const Service = require('./Service');
const {BlockchainService} = require('../hyperledger/blockchain_service');

const statusInfo = {
  'commitHash': 'unknown',
  'apiHash': 'unknown',
  'apiVersion': '?.?.?',
  'hyperledger': {},
};

try {
  const {tags} = require('../.status_info');
  statusInfo.commitHash = tags.commitHash;
  statusInfo.apiHash = tags.apiHash;
  statusInfo.apiVersion = tags.apiVersion;
} catch (e) {
  console.log('could not parse version info: ' + e);
}


/** Show version information of the API
   * @return {string}
  */
const getApiStatus = () => new Promise(
    async (resolve, reject) => {
      const blockchainConnection = new BlockchainService(process.env.BSA_CCP);

      return blockchainConnection.getBlockchainStatus().then((blockchainStatus) => {
        statusInfo.hyperledger = blockchainStatus;

        return blockchainConnection.getBlockchainPeerStatus().then((peerStatus) => {
          statusInfo.hyperledger.peers = peerStatus;
          resolve(Service.successResponse(statusInfo));
        });
      }).catch( (error) => {
        reject(Service.rejectResponse({'code': error.code, 'message': error.message}, 500));
      });
    },
);


/**
*
*
* mspid String Name of a MSP
* returns Object
* */
/**
* Show status information of an MSP
*
* @param {string} mspid - The mspid
* @return {string} - no response value expected for this operation
* */
const getStatusMSP = ({mspid}) => new Promise(
    async (resolve, reject) => {
      const blockchainConnection = new BlockchainService(process.env.BSA_CCP);
      return blockchainConnection.getOffchainStatus(mspid).then((offchainStatus) => {
        resolve(Service.successResponse(offchainStatus));
      }).catch( (error) => {
        reject(Service.rejectResponse({'code': error.code, 'message': error.message}, 500));
      });
    },
);

module.exports = {
  getApiStatus,
  getStatusMSP,
};
