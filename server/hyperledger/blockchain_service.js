const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const {Gateway, Wallets} = require('fabric-network');
const SingleMSPQueryHandler = require('./query_handler');
const {ErrorCode} = require('../utils/errorcode');

const sleep = require('util').promisify(setTimeout);

/** BlockChainService class
*/
class BlockchainService {
  /** Constructor
   * @param {string} ccpFilename - a ccp config file
  */
  constructor(ccpFilename) {
    this.network = this.connectToNetwork(ccpFilename);
  };

  /** open a network connection
   * @param {string} ccpFilename - a ccp config file
  */
  async connectToNetwork(ccpFilename) {
    console.log('> openNetwork() will use ccp ' + ccpFilename);

    // read ccp profile
    const connectionProfileBinary = await fs.promises.readFile(ccpFilename);
    this.connectionProfile = JSON.parse(connectionProfileBinary.toString());


    // read wallet
    const walletPath = path.dirname(ccpFilename) + '/' + this.connectionProfile.config.walletPath;
    console.log('> using wallet from ' + walletPath);
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // gateway options
    const gatewayOptions = {
      wallet,
      identity: this.connectionProfile.config.user,
      discovery: this.connectionProfile.config.discoveryOptions,
      clientTlsIdentity: this.connectionProfile.client.clientTlsIdentity,
      queryHandlerOptions: {
        strategy: SingleMSPQueryHandler.createSingleMSPQueryHandler,
      },
    };

    // connect to the gateway
    this.gateway = new Gateway();
    await this.gateway.connect(this.connectionProfile, gatewayOptions);

    // try to obtain the network
    let triesToDo = 5;
    while (triesToDo-- > 1) {
      try {
        const network = await this.gateway.getNetwork(this.connectionProfile.config.channelName);
        return network;
      } catch (error) {
        console.log('> failed to access channel ' + this.connectionProfile.config.channelName + ' - ' + error.toString());
        console.log(error);
        console.log('> will retry in 5s... ('+triesToDo+' retries left)');
      }
      await sleep(5000);
    }

    // failed to connect
    console.log('> failed to access channel. giving up.');
    process.exit(1);
  }

  /** close a network connection
  */
  disconnect() {
    console.log('> closing fabric connection');
    this.gateway.disconnect();
  }

  /** set the offchain url
   * @param {string} url - the url of the offchain db
   * @return {Promise}
  */
  setOffchainDBConfig(url) {
    const self = this;

    return this.network.then( (network) => {
      // fetch contract
      const contract = network.getContract(self.connectionProfile.config.contractID);

      // fetch my org
      const msp = self.connectionProfile.organizations[self.connectionProfile.client.organization].mspid;

      // configure offchain api
      console.log('> will configure offchain url of MSP ' + msp + ' endpoint to ' + url);

      // send transaction
      const tx = contract.createTransaction('SetOffchainDBConfig');

      return tx.setTransient({'uri': Buffer.from(url).toString('base64')})
          .setEndorsingOrganizations(msp)
          .submit()
          .then( (_) => {
            return tx.getTransactionId();
          })
          .catch( (txError) => {
            // FIXME: this returns a list of errors, one for each peer!
            //        for now return the first error
            for (const item of txError.responses) {
              // console.log(item.response);
              if (item.response.status != 200) {
                console.log('ERROR: peer ' + item.peer + ' reported: ' + item.response);
                return Promise.reject(ErrorCode.fromError(item.response, 'SetOffchainDBConfig('+msp+',' + url+') failed'));
              }
            }
            // if this does not trigger (this should never happen?!)
            console.log(txError);
            return Promise.reject(new ErrorCode('ERROR_INTERNAL', 'SetOffchainDBConfig('+msp+',' + url+') failed'));
          });
    });
  }

  /** get the offchain db url
   * @return {string}
  */
  getOffchainDBConfig() {
    const self = this;

    return this.network.then( (network) => {
    // fetch contract
      const contract = network.getContract(self.connectionProfile.config.contractID);

      // fetch our MSP name
      const localMSP = this.connectionProfile.organizations[this.connectionProfile.client.organization].mspid;

      // enable filter
      network.queryHandler.setFilter(localMSP);

      return contract.evaluateTransaction('GetOffchainDBConfig', ...[]).then( (result) => {
        // reset filter
        network.queryHandler.setFilter('');

        console.log('> got offchain db config ' + result);
        return result.toString(); ;
      }).catch( (error) => {
        return Promise.reject(ErrorCode.fromError(error, 'GetOffchainDBConfig() failed'));
      });
    });
  }

  /** store a document
   * @param {Network} network - a fabric network object
   * @param {Contract} contract - a fabric contract object
   * @param {string} onMSP - MSP where to execute this call
   * @param {string} partnerMSP - the partnerMSP
   * @param {string} referenceID - a referenceID of a document
   * @param {string} documentBase64 - a bas64 encoded document
   * @return {Promise}
  */
  storeDocument(network, contract, onMSP, partnerMSP, referenceID, documentBase64) {
    console.log('> storing document with id ' + referenceID);

    // enable filter
    network.queryHandler.setFilter(onMSP);

    return contract.evaluateTransaction('StorePrivateDocument', ...[partnerMSP, referenceID, documentBase64]).then( (result) => {
      // reset filter
      network.queryHandler.setFilter('');

      const hash = result.toString();

      // done
      console.log('> ' + onMSP + ' stored data with #' + hash);

      return hash;
    }).catch( (error) => {
      return Promise.reject(ErrorCode.fromError(error, 'StorePrivateDocument('+partnerMSP+',' + referenceID+', ...) failed'));
    });
  }

  /** store a documentHash on the ledger
   * @param {Contract} contract - a fabric contract object
   * @param {string} storageKey - the storagekey
   * @param {string} documentHash - a document hash
   * @param {string} referenceID - the referenceID of the document
   * @return {Promise}
  */
  storeDocumentHash(contract, storageKey, documentHash, referenceID) {
    // send transaction
    const tx = contract.createTransaction('StoreDocumentHash');
    console.log('> will store signature at key ' + storageKey);

    return tx.submit(...[storageKey, documentHash]).then( (_) => {
      const result = {};
      result.referenceID = referenceID;
      result.txID = tx.getTransactionId();
      return result;
    }).catch( (error) => {
      return Promise.reject(ErrorCode.fromError(error, 'StoreDocumentHash('+storageKey+',' + documentHash+') failed'));
    });
  }

  /** add a document
   * @param {string} partnerMSP - the partnerMSP
   * @param {string} documentBase64 - a bas64 encoded document
   * @return {Promise}
  */
  addDocument(partnerMSP, documentBase64) {
    const self = this;

    return this.network.then( (network) => {
      // fetch contract
      const contract = network.getContract(self.connectionProfile.config.contractID);

      // calc expected hash
      const expectedHash = crypto.createHash('sha256').update(documentBase64).digest('hex');

      // fetch our MSP name
      const fromMSP = self.connectionProfile.organizations[self.connectionProfile.client.organization].mspid;

      // fetch referenceID
      return self.createReferenceID(network, contract).then( (referenceID) => {
        // EVALUATE store document on fromMSP (local)
        return self.storeDocument(network, contract, fromMSP, partnerMSP, referenceID, documentBase64).then( (hash) => {
          // check hash
          if (expectedHash != hash) {
            console.log('ERROR: '+fromMSP + ' stored invalid hash: ' + hash + ' != ' + expectedHash);
            return Promise.reject(ErrorCode.createErrorCode('ERROR_INTERNAL', fromMSP + ' stored invalid hash'));
          }

          // EVALUATE store document on partnerMSP (remote)
          return self.storeDocument(network, contract, partnerMSP, partnerMSP, referenceID, documentBase64).then( () => {
            // check hash
            if (expectedHash != hash) {
              console.log('ERROR: '+partnerMSP + ' stored invalid hash: ' + hash + ' != ' + expectedHash);
              return Promise.reject(ErrorCode.createErrorCode('ERROR_INTERNAL', partnerMSP + ' stored invalid hash'));
            }

            // calculate storage key
            return self.createStorageKey(network, contract, fromMSP, referenceID).then( (storageKey) => {
              return self.storeDocumentHash(contract, storageKey, hash, referenceID);
            });
          });
        });
      });
    });
  }

  /** createStorageKey for a referenceID
   * @param {Network} network - a fabric network object
   * @param {Contract} contract - a fabric contract object
   * @param {string} partnerMSP - the partnerMSP
   * @param {string} referenceID - a referenceID of a document
   * @return {Promise}
  */
  createStorageKey(network, contract, partnerMSP, referenceID) {
    // fetch our MSP name
    const localMSP = this.connectionProfile.organizations[this.connectionProfile.client.organization].mspid;

    // enable filter
    network.queryHandler.setFilter(localMSP);

    return contract.evaluateTransaction('CreateStorageKey', ...[partnerMSP, referenceID]).then( (result) => {
      // reset filter
      network.queryHandler.setFilter('');

      const storageKey = result.toString();
      console.log('> got storage key ' + storageKey + ' for MSP ' + partnerMSP);

      return storageKey;
    }).catch( (error) => {
      return Promise.reject(ErrorCode.fromError(error, 'CreateStorageKey(' + partnerMSP + ', ' + referenceID + ') failed'));
    });
  }

  /** create a unique referenceID
   * @param {Network} network - a fabric network object
   * @param {Contract} contract - a fabric contract object
   * @return {Promise}
  */
  createReferenceID(network, contract) {
    // fetch our MSP name
    const localMSP = this.connectionProfile.organizations[this.connectionProfile.client.organization].mspid;

    // enable filter
    network.queryHandler.setFilter(localMSP);

    return contract.evaluateTransaction('CreateReferenceID', ...[]).then( (result) => {
      // reset filter
      network.queryHandler.setFilter('');

      const referenceID = result.toString();
      console.log('> got referenceID ' + referenceID);

      return referenceID;
    }).catch( (error) => {
      return Promise.reject(ErrorCode.fromError(error, 'CreateReferenceID() failed'));
    });
  }

  /** store a signature on the ledger
   * @param {Contract} contract - a fabric contract object
   * @param {string} storageKey - a storage key
   * @param {string} signature - a signature object
   * @return {Promise}
  */
  storeSignature(contract, storageKey, signature) {
    // send transaction
    const tx = contract.createTransaction('StoreSignature');
    console.log('> will store signature at key ' + storageKey);

    return tx.submit(...[storageKey, signature]).then( (_) => {
      return tx.getTransactionId();
    }).catch( (error) => {
      return Promise.reject(ErrorCode.fromError(error, 'StoreSignature(' + storageKey + ', ...) failed'));
    });
  }

  /** sign a document
   * @param {string} referenceID - a document referenceID
   * @param {string} signatureJSON - a signature object
   * @return {Promise}
  */
  signDocument(referenceID, signatureJSON) {
    const self = this;
    console.log('> signDocument(' + referenceID + ', ...)');

    return this.network.then( (network) => {
      // fetch contract
      const contract = network.getContract(self.connectionProfile.config.contractID);

      // fetch our MSP name
      const localMSP = self.connectionProfile.organizations[self.connectionProfile.client.organization].mspid;

      // calculate storage key
      return self.createStorageKey(network, contract, localMSP, referenceID).then( (storageKey) => {
        return self.storeSignature(contract, storageKey, signatureJSON);
      });
    });
  }

  /** get signatures for a given storage key
   * @param {Network} network - a fabric network object
   * @param {Contract} contract - a fabric contract object
   * @param {string} msp - a msp
   * @param {string} storageKey - a storage key
   * @return {Promise}
  */
  getSignatures(network, contract, msp, storageKey) {
    // enable filter to execute query on our MSP
    const onMSP = this.connectionProfile.organizations[this.connectionProfile.client.organization].mspid;
    network.queryHandler.setFilter(onMSP);

    return contract.evaluateTransaction('GetSignatures', ...[msp, storageKey]).then( (jsonSignatures) => {
      // reset filter
      network.queryHandler.setFilter('');

      console.log('> reply: GetSignatures(' + msp + ', ' + storageKey + ') = ' + jsonSignatures);

      // check for error
      if (jsonSignatures == '{}') {
        console.log('> got no results');
        return {};
      }

      // parse data
      const txSet = JSON.parse(jsonSignatures);
      console.log('> ' + msp + ' found ' + Object.keys(txSet).length + ' signatures for key ' + storageKey);

      const signatures = {};
      for (const txID in txSet) {
        if (txSet.hasOwnProperty(txID)) {
          console.log('> decoding signature with txID ' + txID);
          const entry = txSet[txID].replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
          signatures[txID] = JSON.parse(entry);
        }
      }

      return signatures;
    }).catch( (error) => {
      return Promise.reject(ErrorCode.fromError(error, 'GetSignatures(' + msp + ', ' + storageKey + ') failed'));
    });
  }

  /** get signature for a given referenceID
   * @param {string} msp - a msp
   * @param {string} referenceID - a referenceID of a document
   * @return {Promise}
  */
  fetchSignatures(msp, referenceID) {
    const self = this;

    return this.network.then( (network) => {
      // fetch contract
      const contract = network.getContract(self.connectionProfile.config.contractID);

      console.log('> fetching signatures for <' + msp + '> and referenceID ' + referenceID);

      // calculate storage key for our own signatures:
      return self.createStorageKey(network, contract, msp, referenceID).then( (storageKey) => {
        console.log('> accessing data using storage key ' + storageKey);
        return self.getSignatures(network, contract, msp, storageKey);
      });
    });
  }

  /** get a private document for a given referenceID
   * @param {string} referenceID - a referenceID of a document
   * @return {Promise}
  */
  fetchPrivateDocument(referenceID) {
    const self = this;

    return this.network.then( (network) => {
      // fetch contract
      const contract = network.getContract(self.connectionProfile.config.contractID);

      console.log('> fetching document for referenceID ' + referenceID);

      // enable filter to execute query on our MSP
      const onMSP = this.connectionProfile.organizations[this.connectionProfile.client.organization].mspid;
      network.queryHandler.setFilter(onMSP);

      return contract.evaluateTransaction('FetchPrivateDocument', ...[referenceID]).then( (document) => {
        // reset filter
        network.queryHandler.setFilter('');

        console.log('> reply: FetchPrivateDocument(#' + referenceID + ') = ' + document);

        // check for error
        if (document == '{}') {
          console.log('> got no results');
          return {};
        }

        return document.toString();
      }).catch( (error) => {
        console.log(error);
        return Promise.reject(ErrorCode.fromError(error, 'FetchPrivateDocument(' + referenceID + ') failed'));
      });
    });
  }


  /** delete a private document for a given referenceID
   * @param {string} referenceID - a referenceID of a document
   * @return {void}
  */
  deletePrivateDocument(referenceID) {
    const self = this;

    return this.network.then( (network) => {
      // fetch contract
      const contract = network.getContract(self.connectionProfile.config.contractID);

      console.log('> deleting document for referenceID ' + referenceID);

      // enable filter to execute query on our MSP
      const onMSP = this.connectionProfile.organizations[this.connectionProfile.client.organization].mspid;
      network.queryHandler.setFilter(onMSP);

      return contract.evaluateTransaction('DeletePrivateDocument', ...[referenceID]).then( () => {
        // reset filter
        network.queryHandler.setFilter('');

        console.log('> reply: DeletePrivateDocument(#' + referenceID + ')');

        return;
      }).catch( (error) => {
        return Promise.reject(ErrorCode.fromError(error, 'DeletePrivateDocument(' + referenceID + ') failed'));
      });
    });
  }

  /** get private documents referenceIDs
   * @return {Promise}
  */
  fetchPrivateDocumentReferenceIDs() {
    const self = this;

    return this.network.then( (network) => {
    // fetch contract
      const contract = network.getContract(self.connectionProfile.config.contractID);

      console.log('> fetching documents');

      // enable filter to execute query on our MSP
      const onMSP = this.connectionProfile.organizations[this.connectionProfile.client.organization].mspid;
      network.queryHandler.setFilter(onMSP);

      return contract.evaluateTransaction('FetchPrivateDocumentReferenceIDs', ...[]).then( (referenceIDs) => {
        // reset filter
        network.queryHandler.setFilter('');

        console.log(referenceIDs.toString());

        // check for error
        if (referenceIDs == '{}') {
          console.log('> got no results');
          return {};
        }

        return referenceIDs.toString();
      }).catch( (error) => {
        return Promise.reject(ErrorCode.fromError(error, 'FetchPrivateDocumentReferenceIDs() failed'));
      });
    });
  }

  /** get discovery results as msp list
   * @return {Promise}
  */
  getDiscoveryMSPs() {
    return this.network.then( (network) => {
      return (network.getChannel().getMspids());
    });
  }

  /** get discovery results for a given msp
   * @param {string} mspID - a msp
   * @return {Promise}
  */
  getDiscoveryMSP(mspID) {
    return this.network.then( (network) => {
      const results = network.getChannel().getMsp(mspID);
      if (results != undefined) {
        return results;
      } else {
        return Promise.reject(ErrorCode.createErrorCode('ERROR_INTERNAL', 'MSP ' + mspid + ' not found.'));
      }
    });
  }

  /** subscribe to ledger events
   * @param {function} callback - your callback function
   * @return {Promise} listener object
  */
  subscribeLedgerEvents(callback) {
    const self = this;

    return this.network.then( (network) => {
      // fetch contract
      const contract = network.getContract(self.connectionProfile.config.contractID);

      // construct listener
      const listener = async (event) => {
        const eventDataRaw = event.payload.toString();
        const eventData = JSON.parse(eventDataRaw);
        const msp = event.getTransactionEvent().transactionData.actions[0].header.creator.mspid;
        
        // enhance event data with the txID
        eventData.txID = event.getTransactionEvent().transactionId;

        console.log('> INCOMING EVENT: [' + msp + '] <' + event.eventName + '> --> ' + eventDataRaw + ' (txID ' + eventData.txID + ')');

        // publish evenData
        callback(eventData.eventName, eventData);
      };

      return contract.addContractListener(listener);
    });
  };


  /** get some hyperledger status
   * @return {Promise} struct with hyperledger status data (channel, contract, and localMSP)
  */
  getBlockchainStatus() {
    const self = this;
    return this.network.then( (_) => {
      // wait for network to be connected so that we are sure the config was read
      const result = {};
      result.localMSP = self.connectionProfile.organizations[self.connectionProfile.client.organization].mspid;
      result.channel = self.connectionProfile.config.channelName;
      result.contractID = self.connectionProfile.config.contractID;
      return result;
    }).catch( (error) => {
      console.log(error);
      return Promise.reject(new ErrorCode('ERROR_INTERNAL', 'getBlockchainStatus() failed'));
    });
  }
}

module.exports = {BlockchainService};
