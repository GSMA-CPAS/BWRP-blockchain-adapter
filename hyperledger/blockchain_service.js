const fs = require('fs');
const path = require('path')
const { Gateway, Wallets } = require('fabric-network');
const SingleMSPQueryHandler = require('./query_handler');

class BlockchainService {
	constructor(ccpFilename) {
        this.network = this.connectToNetwork(ccpFilename)
    };

    // open a network connection
    async connectToNetwork(ccpFilename) {
        console.log("> openNetwork() will use ccp " + ccpFilename)

        // read ccp profile
        const connectionProfileBinary = await fs.promises.readFile(ccpFilename)
        this.connectionProfile = JSON.parse(connectionProfileBinary.toString());
        
        
        // read wallet
        const walletPath = path.dirname(ccpFilename) + "/" + this.connectionProfile.config.walletPath
        console.log("> using wallet from " + walletPath)
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        // gateway options
        const gatewayOptions = {
            wallet,
            identity            : this.connectionProfile.config.user, 
            discovery           : this.connectionProfile.config.discoveryOptions,
            clientTlsIdentity   : this.connectionProfile.client.clientTlsIdentity,
            queryHandlerOptions : {
                strategy: SingleMSPQueryHandler.createSingleMSPQueryHandler
            }
        }
        
        // connect to the gateway
        const gateway = new Gateway();
        await gateway.connect(this.connectionProfile, gatewayOptions);
    
        // obtain the network
        return await gateway.getNetwork(this.connectionProfile.config.channelName);
    }

    setRESTConfig(url) {
        let self = this
        
        return this.network.then( network => {
            // fetch contract
            const contract = network.getContract(self.connectionProfile.config.contractID);

            // fetch my org
            const msp = self.connectionProfile.organizations[self.connectionProfile.client.organization].mspid
            
            // configure REST api
            console.log("> will configure REST of MSP "+msp+" endpoint to " + url)
            
            // send transaction
            try{
                let tx = contract.createTransaction('SetRESTConfig')

                return tx.setTransient({"uri" : Buffer.from(url).toString('base64')})
                  .setEndorsingOrganizations(msp)
                  .submit()
                  .then( res => {
                    return tx.getTransactionId()
                  })
            } catch (e) {
                return e
            }
        });
    }
}

const ccp = "/home/sschulz/src/restadapter_node/ccp/DTAG.json"
const blockchain_connection = new BlockchainService(ccp);

module.exports = { blockchain_connection };