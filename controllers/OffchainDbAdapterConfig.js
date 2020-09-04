'use strict';

var utils = require('../utils/writer.js');
var OffchainDbAdapterConfig = require('../service/OffchainDbAdapterConfigService');

module.exports.setOffchainDBAdapterConfig = function setOffchainDBAdapterConfig (req, res, next, body) {
  OffchainDbAdapterConfig.setOffchainDBAdapterConfig(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
