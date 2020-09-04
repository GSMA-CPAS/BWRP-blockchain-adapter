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
                    return Promise.reject(error);
                });
        });
    }

    storeDocument(network, contract, onMSP, partnerMSP, document){
        
        // enable filter
        network.queryHandler.setFilter(onMSP)
        
        return contract.evaluateTransaction("StorePrivateDocument", ...[partnerMSP, document]).then( result => {
            // reset filter
            network.queryHandler.setFilter("")

            const hash = result.toString()

            // done
            console.log("> " + onMSP + " stored data with hash " + hash)

            return hash
        })
    }

    addDocument(partnerMSP, document) {
        let self = this
        
        return this.network.then( network => {
            // fetch contract
            const contract = network.getContract(self.connectionProfile.config.contractID);
            
            // calc expected hash
            const expectedHash = crypto.createHash('sha256').update(document).digest('hex');
    
            // fetch our MSP name
            const fromMSP = self.connectionProfile.organizations[self.connectionProfile.client.organization].mspid
            
            // EVALUATE store document on fromMSP (local)
            return self.storeDocument(network, contract, fromMSP, partnerMSP, document).then( hash => {
                // check hash
                if (expectedHash != hash){
                    return Promise.reject(fromMSP + " stored invalid hash: " + hash + " != " + expectedHash)
                }

                // EVALUATE store document on partnerMSP (remote)
                return self.storeDocument(network, contract, partnerMSP, partnerMSP, document).then( () => {
                    // check hash
                    if (expectedHash != hash){
                        return Promise.reject(partnerMSP + " stored invalid hash: " + hash + " != " + expectedHash)
                    }

                    return hash
                });
            });
        });
    }

    createStorageKey(network, contract, onMSP, partnerMSP, document){
        // enable filter
        network.queryHandler.setFilter(onMSP)
        
        return contract.evaluateTransaction("CreateStorageKey", ...[partnerMSP, document]).then( result => {
            // reset filter
            network.queryHandler.setFilter("")

            const storageKey = result.toString()
            console.log("> got storage key "+storageKey+ " for MSP " + partnerMSP)

            return storageKey;
        })
    }

    storeSignature(network, contract, storageKey, signature){
        // send transaction
        let tx = contract.createTransaction('StoreSignature')

        return tx.submit(...[storageKey, signature]).then( _ => {
            return tx.getTransactionId()
        }).catch( error => {
            // forward error to main app
            return Promise.reject(error);
        });
    }

    getSignatures(network, contract, storageKey, msp){
        // enable filter to execute query on our MSP
        const onMSP = this.connectionProfile.organizations[this.connectionProfile.client.organization].mspid
        network.queryHandler.setFilter(onMSP)

        return contract.evaluateTransaction("GetSignatures", ...[msp, storageKey]).then( signatures => {
            // reset filter
            network.queryHandler.setFilter("")

            console.log(signatures)

            return "";
        })
    }

    signDocument(document, signature, signer, pem) {
        let self = this
        
        return this.network.then( network => {
            // fetch contract
            const contract = network.getContract(self.connectionProfile.config.contractID);
            
            // fetch our MSP name
            const fromMSP = self.connectionProfile.organizations[self.connectionProfile.client.organization].mspid

            // create signature object
            const signatureJSON = '{ "signer" : "' + signer + '", "pem" : "' + pem + '", "signature" : "' + signature + '" }'

            // calculate storage key
            return self.createStorageKey(network, contract, fromMSP, fromMSP, document).then( storageKey => {
                return self.storeSignature(network, contract, storageKey, signatureJSON).then( txID => {
                    // fetch our MSP name
            
                    return self.getSignatures(network, contract, storageKey, fromMSP)
                    //return txID
                });
            });
/*
            contractORG1.CreateStorageKey(ORG1.Name, documentBase64)

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
            });*/
        });
    }
}


module.exports = { BlockchainService };