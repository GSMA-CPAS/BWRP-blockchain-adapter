'use strict';

var utils = require('../utils/writer.js');
var PrivateDocument = require('../service/PrivateDocumentService');

module.exports.fetchPrivateDocument = function fetchPrivateDocument (req, res, next, hash) {
  PrivateDocument.fetchPrivateDocument(hash)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response, 500);
    });
};

module.exports.uploadPrivateDocument = function uploadPrivateDocument (req, res, next, body) {
  PrivateDocument.uploadPrivateDocument(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response, 500);
    });
};
