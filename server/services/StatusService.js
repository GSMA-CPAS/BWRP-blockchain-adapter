/* eslint-disable no-unused-vars */
const Service = require('./Service');

var statusInfo = {
  "commitHash": "unknown",
  "apiHash" : "unknown",
  "apiVersion" : "?.?.?",  
}

try {
  const { tags } = require('../.status_info');
  statusInfo.commitHash = tags.commitHash;
  statusInfo.apiHash = tags.apiHash;
  statusInfo.apiVersion = tags.apiVersion;
} catch (e) {
  console.log("could not parse version info: " + e)
}

/**
* Show version information of the API
*
* returns String
* */
const getStatus = () => new Promise(
  async (resolve, reject) => {
    resolve(Service.successResponse(JSON.stringify(statusInfo)));
  },
);

module.exports = {
  getStatus,
};
