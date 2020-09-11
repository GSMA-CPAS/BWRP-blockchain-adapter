const fs = require('fs');
const path = require('path')
var crypto = require('crypto');

const { Gateway, Wallets, ContractListener } = require('fabric-network');
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
            console.log("> will configure REST of MSP " + msp + " endpoint to " + url)
            
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
            console.log("> " + onMSP + " stored data with #" + hash)

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

    // this will always be run locally
    createStorageKey(network, contract, partnerMSP, document){
        // fetch our MSP name
        const localMSP = this.connectionProfile.organizations[this.connectionProfile.client.organization].mspid
        
        // enable filter
        network.queryHandler.setFilter(localMSP)
        
        return contract.evaluateTransaction("CreateStorageKey", ...[partnerMSP, document]).then( result => {
            // reset filter
            network.queryHandler.setFilter("")

            const storageKey = result.toString()
            console.log("> got storage key " + storageKey + " for MSP " + partnerMSP)

            return storageKey;
        })
    }

    // this will always be run locally
    createStorageKeyFromHash(network, contract, partnerMSP, documentHash){
        // fetch our MSP name
        const localMSP = this.connectionProfile.organizations[this.connectionProfile.client.organization].mspid

        // enable filter
        network.queryHandler.setFilter(localMSP)
        
        return contract.evaluateTransaction("CreateStorageKeyFromHash", ...[partnerMSP, documentHash]).then( result => {
            // reset filter
            network.queryHandler.setFilter("")

            const storageKey = result.toString()
            console.log("> got storage key " + storageKey + " for MSP " + partnerMSP)

            return storageKey;
        })
    }

    storeSignature(network, contract, storageKey, signature){
        // send transaction
        let tx = contract.createTransaction('StoreSignature')
        console.log("> will store signature at key " + storageKey)

        return tx.submit(...[storageKey, signature]).then( _ => {
            return tx.getTransactionId()
        }).catch( error => {
            // forward error to main app
            return Promise.reject(error);
        });
    }

    signDocument(document_hash, signature, signer, pem) {
        let self = this
        console.log("> signDocument(#" + document_hash + ", ..., " + signer + ", ...)")

        return this.network.then( network => {
            // fetch contract
            const contract = network.getContract(self.connectionProfile.config.contractID);
            
            // test the event API
            const listener = async (event) => {
                if (event.eventName === 'STORE:SIGNATURE') {
                    const details = event.payload.toString()
                    const msp = event.getTransactionEvent().transactionData.actions[0].header.creator.mspid

                    console.log("> INCOMING EVENT: [" + msp + "] store signature <" + event.eventName + "> --> " + details)
                    if (0) {
                        // for debugging why i see a previous event replayed, see my bug report
                        // https://jira.hyperledger.org/browse/FABN-1634
                        console.log(event.getTransactionEvent())
                        console.log(event.getTransactionEvent().transactionData)
                        console.log(event.getTransactionEvent().transactionData.actions[0].header)
                        console.log(event.getTransactionEvent().transactionData.actions[0].payload)
                        console.log(event.getTransactionEvent().getBlockEvent())
                    }
                }
            };
            contract.addContractListener(listener)

            // fetch our MSP name
            const localMSP = self.connectionProfile.organizations[self.connectionProfile.client.organization].mspid

            // create signature object
            const signatureJSON = '{ "Signer" : "' + signer + '", "PEM" : "' + pem + '", "Signature" : "' + signature + '" }'

            // calculate storage key
            return self.createStorageKeyFromHash(network, contract, localMSP, document_hash).then( storageKey => {
                return self.storeSignature(network, contract, storageKey, signatureJSON)
            });
        });
    }


    // this will always be run locally
    getSignatures(network, contract, msp, storageKey){
        // enable filter to execute query on our MSP
        const onMSP = this.connectionProfile.organizations[this.connectionProfile.client.organization].mspid
        network.queryHandler.setFilter(onMSP)

        return contract.evaluateTransaction("GetSignatures", ...[msp, storageKey]).then( jsonSignatures => {
            // reset filter
            network.queryHandler.setFilter("")

            console.log("> reply: GetSignatures(" + msp + ", " + storageKey + ") = " + jsonSignatures)

            // check for error
            if (jsonSignatures == "{}"){
                console.log("> got no results")
                return {}
            }

            // parse data
            const txSet = JSON.parse(jsonSignatures);
            console.log("> " + msp + " found " + Object.keys(txSet).length + " signatures for key " + storageKey)

            var signatures = {}
            for (var txID in txSet) {
                console.log("> decoding signature with txID " + txID)
                var entry = txSet[txID].replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
                signatures[txID] = JSON.parse(entry);
            }

            return signatures;
        })
    }

    fetchSignatures(documentHash, msp) {
        let self = this
        
        return this.network.then( network => {
            // fetch contract
            const contract = network.getContract(self.connectionProfile.config.contractID);
            
            console.log("> fetching signatures for <" + msp + "> and #" + documentHash)

            // calculate storage key for our own signatures:
            return self.createStorageKeyFromHash(network, contract, msp, documentHash).then( storageKey => {
                console.log("> accessing data using storage key " + storageKey)
                return self.getSignatures(network, contract, msp, storageKey)
            });
        });
    }

    fetchPrivateDocument(documentHash) {
        let self = this
        
        return this.network.then( network => {
            // fetch contract
            const contract = network.getContract(self.connectionProfile.config.contractID);
            
            console.log("> fetching document for #" + documentHash)

            // enable filter to execute query on our MSP
            const onMSP = this.connectionProfile.organizations[this.connectionProfile.client.organization].mspid
            network.queryHandler.setFilter(onMSP)

            return contract.evaluateTransaction("FetchPrivateDocument", ...[documentHash]).then( document => {
                // reset filter
                network.queryHandler.setFilter("")

                console.log("> reply: FetchPrivateDocument(#" + documentHash + ") = " + document)

                // check for error
                if (document == "{}"){
                    console.log("> got no results")
                    return {}
                }

                return document.toString();
            });
        });
    }
}

module.exports = { BlockchainService };