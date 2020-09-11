const Service = require('./Service');
var { BlockchainService } = require('../hyperledger/blockchain_service');

/**
* Update the configuration of the offchain-db-adapter
*
* body OffchainDBAdapterConfig A configuration for the offchain-db-adapter
* returns String
* */
const setOffchainDBAdapterConfig = ({ body }) => new Promise(
  async (resolve, reject) => {
    const blockchain_connection = new BlockchainService(process.env.BSA_CCP);
  
    blockchain_connection.setRESTConfig(body["restURI"])
      .then( txID => {
        var resJSON = {};
        resJSON['txID'] = txID;
        console.log("> stored data with txID " + txID)
        resolve(Service.successResponse(resJSON, 200))
      }).catch(error => {
        console.log("ERROR: " + error)
        reject(Service.rejectResponse({"message" : error.toString()}, 500))
      }).finally( () => {
        blockchain_connection.disconnect()
      });
  },
);

module.exports = {
  setOffchainDBAdapterConfig,
};
