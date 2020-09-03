'use strict';

var ConfigOffchainDbAdapter = require('../service/ConfigOffchainDbAdapterService');
var utils = require('../utils/writer.js');

module.exports.setOffchainDBAdapterConfig = function setOffchainDBAdapterConfig (req, res, next, body) {
  ConfigOffchainDbAdapter.setOffchainDBAdapterConfig(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
