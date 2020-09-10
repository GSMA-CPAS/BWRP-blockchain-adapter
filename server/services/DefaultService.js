/* eslint-disable no-unused-vars */
const Service = require('./Service');

/**
* subscribes a client to receive new signature events
*
* callbackUrl URI the location where data will be sent
* returns Object
* */
const signaturesSubscribePOST = ({ callbackUrl }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        callbackUrl,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);

module.exports = {
  signaturesSubscribePOST,
};
