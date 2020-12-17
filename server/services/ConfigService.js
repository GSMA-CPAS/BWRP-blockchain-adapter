const Service = require('./Service');
const {BlockchainService} = require('../hyperledger/blockchain_service');
const {Certificate} = require('crypto');

/** Update the configuration of the offchain-db-adapter
   * @param {OffchainDBConfig} body - A configuration for the offchain-db-adapter
   * @return {string}
  */
const setOffchainDBConfig = ({body}) => new Promise(
    async (resolve, reject) => {
      const blockchainConnection = new BlockchainService(process.env.BSA_CCP);

      blockchainConnection.setOffchainDBConfig(body['URI']).then( (txID) => {
        const resJSON = {};
        resJSON['txID'] = txID;
        console.log('> stored data with txID ' + txID);
        resolve(Service.successResponse(resJSON, 200));
      }).catch((error) => {
        reject(Service.rejectResponse({'code': error.code, 'message': error.message}, 500));
      }).finally( () => {
        blockchainConnection.disconnect();
      });
    },
);

/** Read back the configuration of the offchain-db-adapter
   * @return {OffchainDBConfig}
  */
const getOffchainDBConfig = () => new Promise(
    async (resolve, reject) => {
      const blockchainConnection = new BlockchainService(process.env.BSA_CCP);

      blockchainConnection.getOffchainDBConfig().then( (uri) => {
        const resJSON = {};
        resJSON['URI'] = uri;
        resolve(Service.successResponse(resJSON, 200));
      }).catch((error) => {
        reject(Service.rejectResponse({'code': error.code, 'message': error.message}, 500));
      }).finally( () => {
        blockchainConnection.disconnect();
      });
    },
);

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

module.exports = {
  setOffchainDBConfig,
  getOffchainDBConfig,
  setCertificateRoot,
};
