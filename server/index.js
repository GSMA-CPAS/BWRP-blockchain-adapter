const config = require('./config');
const logger = require('./logger');
const ExpressServer = require('./expressServer');

if (process.env.BSA_PORT == undefined){
  console.log("> port not defined, please set env var BSA_PORT")
  process.exit(1)
}

var serverPort = process.env.BSA_PORT;

if (process.env.BSA_CCP == undefined){
  console.log("> fabric connection profile not not defined, please set env var BSA_CCP")
  process.exit(1)
}

const launchServer = async () => {
  try {
    this.expressServer = new ExpressServer(serverPort, 'api/openapi.yaml');
    this.expressServer.launch();
    logger.info('Express server running');
  } catch (error) {
    logger.error('Express Server failure', error.message);
    await this.close();
  }
};

launchServer().catch(e => logger.error(e));


