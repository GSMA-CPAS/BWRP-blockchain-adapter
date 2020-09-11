/**
 * The ContractController file is a very simple one, which does not need to be changed manually,
 * unless there's a case where business logic reoutes the request to an entity which is not
 * the service.
 * The heavy lifting of the Controller item is done in Request.js - that is where request
 * parameters are extracted and sent to the service, and where response is handled.
 */

const Controller = require('./Controller');
const service = require('../services/ContractService');
const fetchPrivateDocument = async (request, response) => {
  await Controller.handleRequest(request, response, service.fetchPrivateDocument);
};

const fetchSignatures = async (request, response) => {
  await Controller.handleRequest(request, response, service.fetchSignatures);
};

const signaturesSubscribePOST = async (request, response) => {
  await Controller.handleRequest(request, response, service.signaturesSubscribePOST);
};

const uploadPrivateDocument = async (request, response) => {
  await Controller.handleRequest(request, response, service.uploadPrivateDocument);
};

const uploadSignature = async (request, response) => {
  await Controller.handleRequest(request, response, service.uploadSignature);
};


module.exports = {
  fetchPrivateDocument,
  fetchSignatures,
  signaturesSubscribePOST,
  uploadPrivateDocument,
  uploadSignature,
};