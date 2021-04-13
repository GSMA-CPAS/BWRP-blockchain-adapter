/* eslint-disable no-unused-vars */
const Service = require('./Service');
const {BlockchainService} = require('../hyperledger/blockchain_service');


/** Show details for a specific MSP
   * @param {string} mspid - Name of a MSP
   * @return {string}
  */
const getDiscoveryMSP = ({mspid}) => new Promise(
    async (resolve, reject) => {
      const blockchainConnection = new BlockchainService(process.env.BSA_CCP);

      blockchainConnection.getDiscoveryMSP(mspid)
          .then( (results) => {
            resolve(Service.successResponse(results, 200));
          }).catch((error) => {
            reject(Service.rejectResponse({'code': error.code, 'message': error.message}, 500));
          }).finally( () => {
            blockchainConnection.disconnect();
          });
    },
);

/** Show a list of all MSPs
   * @return {string}
  */
const getDiscoveryMSPs = () => new Promise(
    async (resolve, reject) => {
      const blockchainConnection = new BlockchainService(process.env.BSA_CCP);

      blockchainConnection.getDiscoveryMSPs()
          .then( (results) => {
            resolve(Service.successResponse(results, 200));
          }).catch((error) => {
            reject(Service.rejectResponse({'code': error.code, 'message': error.message}, 500));
          }).finally( () => {
            blockchainConnection.disconnect();
          });
    },
);

module.exports = {
  getDiscoveryMSP,
  getDiscoveryMSPs,
};
