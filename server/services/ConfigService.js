const Service = require('./Service');
const {BlockchainService} = require('../hyperledger/blockchain_service');

/** Update the configuration of the offchain-db-adapter
   * @param {OffchainDBAdapterConfig} body - A configuration for the offchain-db-adapter
   * @return {string}
  */
const setOffchainDBAdapterConfig = ({body}) => new Promise(
    async (resolve, reject) => {
      const blockchainConnection = new BlockchainService(process.env.BSA_CCP);

      blockchainConnection.setRESTConfig(body['restURI']).then( (txID) => {
        const resJSON = {};
        resJSON['txID'] = txID;
        console.log('> stored data with txID ' + txID);
        resolve(Service.successResponse(resJSON, 200));
      }).catch((error) => {
        console.log('ERROR: ' + error);
        reject(Service.rejectResponse({'message': error.toString()}, 500));
      }).finally( () => {
        blockchainConnection.disconnect();
      });
    },
);

/** Read back the configuration of the offchain-db-adapter
   * @return {OffchainDBAdapterConfig}
  */
const getOffchainDBAdapterConfig = () => new Promise(
    async (resolve, reject) => {
      const blockchainConnection = new BlockchainService(process.env.BSA_CCP);

      blockchainConnection.getRESTConfig().then( (uri) => {
        const resJSON = {};
        resJSON['restURI'] = uri;
        resolve(Service.successResponse(resJSON, 200));
      }).catch((error) => {
        console.log('ERROR: ' + error);
        reject(Service.rejectResponse({'message': error.toString()}, 500));
      }).finally( () => {
        blockchainConnection.disconnect();
      });
    },
);


module.exports = {
  setOffchainDBAdapterConfig,
  getOffchainDBAdapterConfig,
};
