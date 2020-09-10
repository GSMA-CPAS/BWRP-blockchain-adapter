'use strict';

const {BlockchainService} = require('./hyperledger/blockchain_service')
var path = require('path');
var http = require('http');
var oas3Tools = require('oas3-tools');

if (process.env.BSA_PORT == undefined){
    console.log("> port not defined, please set env var BSA_PORT")
    process.exit(1)
}

var serverPort = process.env.BSA_PORT;

if (process.env.BSA_CCP == undefined){
    console.log("> fabric connection profile not not defined, please set env var BSA_CCP")
    process.exit(1)
}


// swaggerRouter configuration
var options = {
    controllers: path.join(__dirname, './controllers')
};

var expressAppConfig = oas3Tools.expressAppConfig(path.join(__dirname, 'api/openapi.definition.out'), options);
expressAppConfig.addValidator();
var app = expressAppConfig.getApp();

// initialize one blockchainadapter to

// Initialize the Swagger middleware
http.createServer(app).listen(serverPort, function () {
    console.log('Your server is listening on port %d (http://localhost:%d)', serverPort, serverPort);
});

