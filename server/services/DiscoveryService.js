/* eslint-disable no-unused-vars */
const Service = require('./Service');
var { BlockchainService } = require('../hyperledger/blockchain_service');


/**
* Show details for a specific MSP
*
* mspid String Name of a MSP
* returns String
* */
const getDiscoveryMSP = ({ mspid }) => new Promise(
  async (resolve, reject) => {
    const blockchain_connection = new BlockchainService(process.env.BSA_CCP);

    blockchain_connection.getDiscoveryMSP(mspid)
      .then( results => {
        if (results != undefined) {
          resolve(Service.successResponse(JSON.stringify(results), 200))
        } else {
          reject(Service.rejectResponse({"message" : `MSP '${mspid}' not found.`}, 500))  
        }
      }).catch(error => {
        console.log("ERROR: " + error)
        reject(Service.rejectResponse({"message" : error.toString()}, 500))
      }).finally( () => {
        blockchain_connection.disconnect()
      })
  },
);

/**
* Show a list of all MSPs
*
* returns String
* */
const getDiscoveryMSPs = () => new Promise(
  async (resolve, reject) => {
    const blockchain_connection = new BlockchainService(process.env.BSA_CCP);

    blockchain_connection.getDiscoveryMSPs()
      .then( results => {
        resolve(Service.successResponse(JSON.stringify(results), 200))
      }).catch(error => {
        console.log("ERROR: " + error)
        reject(Service.rejectResponse({"message" : error.toString()}, 500))
      }).finally( () => {
        blockchain_connection.disconnect()
      })
  },
);


module.exports = {
  getDiscoveryMSP,
  getDiscoveryMSPs,
};
