const fs = require('fs');
const path = require('path')
var crypto = require('crypto');

const { Gateway, Wallets } = require('fabric-network');
const SingleMSPQueryHandler = require('./query_handler');
const { exit } = require('process');

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
        this.gateway = new Gateway();
        await this.gateway.connect(this.connectionProfile, gatewayOptions);
    
        // obtain the network
        return await this.gateway.getNetwork(this.connectionProfile.config.channelName);
    }

    disconnect(){
        console.log("> closing fabric connection")
        return this.gateway.disconnect()
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
            let tx = contract.createTransaction('SetRESTConfig')

            return tx.setTransient({"uri" : Buffer.from(url).toString('base64')})
                .setEndorsingOrganizations(msp)
                .submit()
                .then( _ => {
                    return tx.getTransactionId()
                })
                .catch( error => {
                    // forward error to main app
                    //throw(error)
                    //return error.toString()
                    return Promise.reject(error);
                });
        });
    }

    storeDocument(network, contract, msp, data, expectedHash){
        network.queryHandler.setFilter(msp)
        
        return contract.evaluateTransaction("StorePrivateDocument", ...data).then( result => {
            // reset filter
            network.queryHandler.setFilter("")

            // check hash
            if (expectedHash != result.toString()){
                return Promise.reject(msp + " stored invalid hash: " + result.toString() + " != " + expectedHash)
            }

            // done
            // console.log("> STORED data (hash "+result.toString()+") on "+msp)
        })
    }

    addDocument(partnerMSP, document) {
        let self = this
        
        return this.network.then( network => {
            // fetch contract
            const contract = network.getContract(self.connectionProfile.config.contractID);
            
            // prepare data
            const data = [partnerMSP, document]

            // calc expected hash
            const expectedHash = crypto.createHash('sha256').update(document).digest('hex');
    
            // fetch our MSP name
            const fromMSP = self.connectionProfile.organizations[self.connectionProfile.client.organization].mspid
            
            // EVALUATE store document on fromMSP (local)
            return self.storeDocument(network, contract, fromMSP, data, expectedHash).then( () => {
                // EVALUATE store document on partnerMSP (remote)
                return self.storeDocument(network, contract, partnerMSP, data, expectedHash).then( () => {
                    return expectedHash
                });
            });
        });
    }
}


module.exports = { BlockchainService };