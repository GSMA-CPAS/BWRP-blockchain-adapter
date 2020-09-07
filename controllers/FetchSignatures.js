'use strict';

var utils = require('../utils/writer.js');
var FetchSignatures = require('../service/FetchSignaturesService');

module.exports.fetchSignatures = function fetchSignatures (req, res, next, hash, msp) {
  FetchSignatures.fetchSignatures(hash, msp)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response, 500);
    });
};
