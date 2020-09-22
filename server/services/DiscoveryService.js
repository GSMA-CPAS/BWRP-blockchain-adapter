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
            if (results != undefined) {
              resolve(Service.successResponse(JSON.stringify(results), 200));
            } else {
              reject(Service.rejectResponse({'message': `MSP '${mspid}' not found.`}, 500));
            }
          }).catch((error) => {
            console.log('ERROR: ' + error);
            reject(Service.rejectResponse({'message': error.toString()}, 500));
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
            resolve(Service.successResponse(JSON.stringify(results), 200));
          }).catch((error) => {
            console.log('ERROR: ' + error);
            reject(Service.rejectResponse({'message': error.toString()}, 500));
          }).finally( () => {
            blockchainConnection.disconnect();
          });
    },
);

module.exports = {
  getDiscoveryMSP,
  getDiscoveryMSPs,
};
