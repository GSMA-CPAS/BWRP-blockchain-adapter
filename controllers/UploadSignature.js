'use strict';

var utils = require('../utils/writer.js');
var UploadSignature = require('../service/UploadSignatureService');

module.exports.uploadSignature = function uploadSignature (req, res, next, body) {
  UploadSignature.uploadSignature(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response, 500);
    });
};
