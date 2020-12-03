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
        resolve(Service.successResponse(JSON.stringify(statusInfo)));
      }).catch( (error) => {
        reject(Service.rejectResponse({'code': error.code, 'message': error.message}, 500));
      });
    },
);


module.exports = {
  getApiStatus,
};
