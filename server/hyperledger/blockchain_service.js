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

    storeDocument(network, contract, onMSP, partnerMSP, documentID, documentBase64){
        console.log("> storing document with id " + documentID)

        // enable filter
        network.queryHandler.setFilter(onMSP)
        
        return contract.evaluateTransaction("StorePrivateDocument", ...[partnerMSP, documentID, documentBase64]).then( result => {
            // reset filter
            network.queryHandler.setFilter("")

            const hash = result.toString()

            // done
            console.log("> " + onMSP + " stored data with #" + hash)

            return hash
        })
    }

    storeDocumentHash(network, contract, storageKey, documentHash){
        // send transaction
        let tx = contract.createTransaction('StoreDocumentHash')
        console.log("> will store signature at key " + storageKey)

        return tx.submit(...[storageKey, documentHash]).then( _ => {
            return tx.getTransactionId()
        }).catch( error => {
            // forward error to main app
            return Promise.reject(error);
        });
    }

    addDocument(partnerMSP, documentBase64) {
        let self = this
        
        return this.network.then( network => {
            // fetch contract
            const contract = network.getContract(self.connectionProfile.config.contractID);
            
            // calc expected hash
            const expectedHash = crypto.createHash('sha256').update(documentBase64).digest('hex');
    
            // fetch our MSP name
            const fromMSP = self.connectionProfile.organizations[self.connectionProfile.client.organization].mspid

            // fetch document ID
            return self.createDocumentID(network, contract).then( documentID => {
                // EVALUATE store document on fromMSP (local)
                return self.storeDocument(network, contract, fromMSP, partnerMSP, documentID, documentBase64).then( hash => {
                    // check hash
                    if (expectedHash != hash){
                        return Promise.reject(fromMSP + " stored invalid hash: " + hash + " != " + expectedHash)
                    }

                    // EVALUATE store document on partnerMSP (remote)
                    return self.storeDocument(network, contract, partnerMSP, partnerMSP, documentID, documentBase64).then( () => {
                        // check hash
                        if (expectedHash != hash){
                            return Promise.reject(partnerMSP + " stored invalid hash: " + hash + " != " + expectedHash)
                        }

                        // calculate storage key
                        return self.createStorageKey(network, contract, fromMSP, documentID).then( storageKey => {
                            return self.storeDocumentHash(network, contract, storageKey, hash).then( _ => {
                                // finally return document id
                                return documentID
                            })
                        });
                    });
                });
            });
        });
    }

    // this will always be run locally
    createStorageKey(network, contract, partnerMSP, documentID){
        // fetch our MSP name
        const localMSP = this.connectionProfile.organizations[this.connectionProfile.client.organization].mspid
        
        // enable filter
        network.queryHandler.setFilter(localMSP)
        
        return contract.evaluateTransaction("CreateStorageKey", ...[partnerMSP, documentID]).then( result => {
            // reset filter
            network.queryHandler.setFilter("")

            const storageKey = result.toString()
            console.log("> got storage key " + storageKey + " for MSP " + partnerMSP)

            return storageKey;
        })
    }

    // this will always be run locally
    createDocumentID(network, contract){
        // fetch our MSP name
        const localMSP = this.connectionProfile.organizations[this.connectionProfile.client.organization].mspid
        
        // enable filter
        network.queryHandler.setFilter(localMSP)
        
        return contract.evaluateTransaction("CreateDocumentID", ...[]).then( result => {
            // reset filter
            network.queryHandler.setFilter("")

            const documentID = result.toString()
            console.log("> got documentID " + documentID)

            return documentID;
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

    signDocument(documentID, signatureJSON) {
        let self = this
        console.log("> signDocument(" + documentID + ", ...)")

        return this.network.then( network => {
            // fetch contract
            const contract = network.getContract(self.connectionProfile.config.contractID);
            
            // fetch our MSP name
            const localMSP = self.connectionProfile.organizations[self.connectionProfile.client.organization].mspid

            // calculate storage key
            return self.createStorageKey(network, contract, localMSP, documentID).then( storageKey => {
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

    fetchSignatures(msp, documentID) {
        let self = this
        
        return this.network.then( network => {
            // fetch contract
            const contract = network.getContract(self.connectionProfile.config.contractID);
            
            console.log("> fetching signatures for <" + msp + "> and document id " + documentID)

            // calculate storage key for our own signatures:
            return self.createStorageKey(network, contract, msp, documentID).then( storageKey => {
                console.log("> accessing data using storage key " + storageKey)
                return self.getSignatures(network, contract, msp, storageKey)
            });
        });
    }

    fetchPrivateDocument(documentID) {
        let self = this
        
        return this.network.then( network => {
            // fetch contract
            const contract = network.getContract(self.connectionProfile.config.contractID);
            
            console.log("> fetching document for id " + documentID)

            // enable filter to execute query on our MSP
            const onMSP = this.connectionProfile.organizations[this.connectionProfile.client.organization].mspid
            network.queryHandler.setFilter(onMSP)

            return contract.evaluateTransaction("FetchPrivateDocument", ...[documentID]).then( document => {
                // reset filter
                network.queryHandler.setFilter("")

                console.log("> reply: FetchPrivateDocument(#" + documentID + ") = " + document)

                // check for error
                if (document == "{}"){
                    console.log("> got no results")
                    return {}
                }

                return document.toString();
            });
        });
    }

    getDiscoveryMSPs() {
        let self = this
        
        return this.network.then( network => {
            return(network.getChannel().getMspids());
        });
    }
    
    getDiscoveryMSP(mspID) {
        let self = this
        
        return this.network.then( network => {
            return network.getChannel().getMsp(mspID);
        });
    }

    getDocumentID(network, contract, storageLocation) {
        // this will always be run locally
        // enable filter to execute query on our MSP
        const onMSP = this.connectionProfile.organizations[this.connectionProfile.client.organization].mspid
        network.queryHandler.setFilter(onMSP)
        
        return contract.evaluateTransaction("GetDocumentID", ...[storageLocation]).then( response => {
            const data = JSON.parse(response)
            return data.documentID
        })
    }

    subscribeLedgerEvents(callback) {
        let self = this
        
        return this.network.then( network => {
            // fetch contract
            const contract = network.getContract(self.connectionProfile.config.contractID);
            
            // construct listener 
            const listener = async (event) => {
                if ((event.eventName === 'STORE:SIGNATURE') || (event.eventName === 'STORE:DOCUMENTHASH')) {
                    const eventDataRaw = event.payload.toString()
                    const eventData = JSON.parse(eventDataRaw)
                    const msp = event.getTransactionEvent().transactionData.actions[0].header.creator.mspid
                    
                    console.log("> INCOMING EVENT: [" + msp + "] store signature <" + event.eventName + "> --> " + eventDataRaw)

                    // resolve documentID from storageLocation
                    self.getDocumentID(network, contract, eventData.data.storageKey).then( (documentID) => {
                        // append documentID to event and notify listeners:
                        eventData["documentID"] = documentID
                        callback(eventData);
                    }).catch( (err) => {
                        console.log("ERROR: " + err)
                        
                        // append documentID to event and notify listeners:
                        eventData["documentID"] = "could_not_resolve_storage_key"
                        callback(eventData);
                    })
                    
                }
            };
            return contract.addContractListener(listener);
        });
    };
}

module.exports = { BlockchainService };