const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const {Gateway, Wallets} = require('fabric-network');
const SingleMSPQueryHandler = require('./query_handler');

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

  /** set the rest url
   * @param {string} url - the url of a offchain db adapter rest server
   * @return {Promise}
  */
  setRESTConfig(url) {
    const self = this;

    return this.network.then( (network) => {
      // fetch contract
      const contract = network.getContract(self.connectionProfile.config.contractID);

      // fetch my org
      const msp = self.connectionProfile.organizations[self.connectionProfile.client.organization].mspid;

      // configure REST api
      console.log('> will configure REST of MSP ' + msp + ' endpoint to ' + url);

      // send transaction
      const tx = contract.createTransaction('SetRESTConfig');

      return tx.setTransient({'uri': Buffer.from(url).toString('base64')})
          .setEndorsingOrganizations(msp)
          .submit()
          .then( (_) => {
            return tx.getTransactionId();
          })
          .catch( (error) => {
            // forward error to main app
            return Promise.reject(error);
          });
    });
  }

  /** get the rest url
   * @return {string}
  */
  getRESTConfig() {
    const self = this;

    return this.network.then( (network) => {
    // fetch contract
      const contract = network.getContract(self.connectionProfile.config.contractID);

      // fetch our MSP name
      const localMSP = this.connectionProfile.organizations[this.connectionProfile.client.organization].mspid;

      // enable filter
      network.queryHandler.setFilter(localMSP);

      return contract.evaluateTransaction('GetRESTConfig', ...[]).then( (result) => {
        // reset filter
        network.queryHandler.setFilter('');

        console.log('> got REST config ' + result);
        return result.toString(); ;
      });
    });
  }

  /** store a document
   * @param {Network} network - a fabric network object
   * @param {Contract} contract - a fabric contract object
   * @param {string} onMSP - MSP where to execute this call
   * @param {string} partnerMSP - the partnerMSP
   * @param {string} documentID - a documentID
   * @param {string} documentBase64 - a bas64 encoded document
   * @return {Promise}
  */
  storeDocument(network, contract, onMSP, partnerMSP, documentID, documentBase64) {
    console.log('> storing document with id ' + documentID);

    // enable filter
    network.queryHandler.setFilter(onMSP);

    return contract.evaluateTransaction('StorePrivateDocument', ...[partnerMSP, documentID, documentBase64]).then( (result) => {
      // reset filter
      network.queryHandler.setFilter('');

      const hash = result.toString();

      // done
      console.log('> ' + onMSP + ' stored data with #' + hash);

      return hash;
    });
  }

  /** store a documentHash on the ledger
   * @param {Contract} contract - a fabric contract object
   * @param {string} storageKey - the storagekey
   * @param {string} documentHash - a document hash
   * @return {Promise}
  */
  storeDocumentHash(contract, storageKey, documentHash) {
    // send transaction
    const tx = contract.createTransaction('StoreDocumentHash');
    console.log('> will store signature at key ' + storageKey);

    return tx.submit(...[storageKey, documentHash]).then( (_) => {
      return tx.getTransactionId();
    }).catch( (error) => {
      // forward error to main app
      return Promise.reject(error);
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

      // fetch document ID
      return self.createDocumentID(network, contract).then( (documentID) => {
        // EVALUATE store document on fromMSP (local)
        return self.storeDocument(network, contract, fromMSP, partnerMSP, documentID, documentBase64).then( (hash) => {
          // check hash
          if (expectedHash != hash) {
            return Promise.reject(new Error(fromMSP + ' stored invalid hash: ' + hash + ' != ' + expectedHash));
          }

          // EVALUATE store document on partnerMSP (remote)
          return self.storeDocument(network, contract, partnerMSP, partnerMSP, documentID, documentBase64).then( () => {
            // check hash
            if (expectedHash != hash) {
              return Promise.reject(new Error(partnerMSP + ' stored invalid hash: ' + hash + ' != ' + expectedHash));
            }

            // calculate storage key
            return self.createStorageKey(network, contract, fromMSP, documentID).then( (storageKey) => {
              return self.storeDocumentHash(contract, storageKey, hash).then( (_) => {
                // finally return document id
                return documentID;
              });
            });
          });
        });
      });
    });
  }

  /** createStorageKey for a documentID
   * @param {Network} network - a fabric network object
   * @param {Contract} contract - a fabric contract object
   * @param {string} partnerMSP - the partnerMSP
   * @param {string} documentID - a documentID
   * @return {Promise}
  */
  createStorageKey(network, contract, partnerMSP, documentID) {
    // fetch our MSP name
    const localMSP = this.connectionProfile.organizations[this.connectionProfile.client.organization].mspid;

    // enable filter
    network.queryHandler.setFilter(localMSP);

    return contract.evaluateTransaction('CreateStorageKey', ...[partnerMSP, documentID]).then( (result) => {
      // reset filter
      network.queryHandler.setFilter('');

      const storageKey = result.toString();
      console.log('> got storage key ' + storageKey + ' for MSP ' + partnerMSP);

      return storageKey;
    });
  }

  /** create a unique documentID
   * @param {Network} network - a fabric network object
   * @param {Contract} contract - a fabric contract object
   * @return {Promise}
  */
  createDocumentID(network, contract) {
    // fetch our MSP name
    const localMSP = this.connectionProfile.organizations[this.connectionProfile.client.organization].mspid;

    // enable filter
    network.queryHandler.setFilter(localMSP);

    return contract.evaluateTransaction('CreateDocumentID', ...[]).then( (result) => {
      // reset filter
      network.queryHandler.setFilter('');

      const documentID = result.toString();
      console.log('> got documentID ' + documentID);

      return documentID;
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
      // forward error to main app
      return Promise.reject(error);
    });
  }

  /** sign a document
   * @param {string} documentID - a document id
   * @param {string} signatureJSON - a signature object
   * @return {Promise}
  */
  signDocument(documentID, signatureJSON) {
    const self = this;
    console.log('> signDocument(' + documentID + ', ...)');

    return this.network.then( (network) => {
      // fetch contract
      const contract = network.getContract(self.connectionProfile.config.contractID);

      // fetch our MSP name
      const localMSP = self.connectionProfile.organizations[self.connectionProfile.client.organization].mspid;

      // calculate storage key
      return self.createStorageKey(network, contract, localMSP, documentID).then( (storageKey) => {
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
    });
  }

  /** get signature for a given documentID
   * @param {string} msp - a msp
   * @param {string} documentID - a document id
   * @return {Promise}
  */
  fetchSignatures(msp, documentID) {
    const self = this;

    return this.network.then( (network) => {
      // fetch contract
      const contract = network.getContract(self.connectionProfile.config.contractID);

      console.log('> fetching signatures for <' + msp + '> and document id ' + documentID);

      // calculate storage key for our own signatures:
      return self.createStorageKey(network, contract, msp, documentID).then( (storageKey) => {
        console.log('> accessing data using storage key ' + storageKey);
        return self.getSignatures(network, contract, msp, storageKey);
      });
    });
  }

  /** get a private document for a given documentID
   * @param {string} documentID - a document id
   * @return {Promise}
  */
  fetchPrivateDocument(documentID) {
    const self = this;

    return this.network.then( (network) => {
      // fetch contract
      const contract = network.getContract(self.connectionProfile.config.contractID);

      console.log('> fetching document for id ' + documentID);

      // enable filter to execute query on our MSP
      const onMSP = this.connectionProfile.organizations[this.connectionProfile.client.organization].mspid;
      network.queryHandler.setFilter(onMSP);

      return contract.evaluateTransaction('FetchPrivateDocument', ...[documentID]).then( (document) => {
        // reset filter
        network.queryHandler.setFilter('');

        console.log('> reply: FetchPrivateDocument(#' + documentID + ') = ' + document);

        // check for error
        if (document == '{}') {
          console.log('> got no results');
          return {};
        }

        return document.toString();
      });
    });
  }

  /** delete a private document for a given documentID
   * @param {string} documentID - a document id
   * @return {void}
  */
  deletePrivateDocument(documentID) {
    const self = this;

    return this.network.then( (network) => {
      // fetch contract
      const contract = network.getContract(self.connectionProfile.config.contractID);

      console.log('> deleting document for id ' + documentID);

      // enable filter to execute query on our MSP
      const onMSP = this.connectionProfile.organizations[this.connectionProfile.client.organization].mspid;
      network.queryHandler.setFilter(onMSP);

      return contract.evaluateTransaction('DeletePrivateDocument', ...[documentID]).then( () => {
        // reset filter
        network.queryHandler.setFilter('');

        console.log('> reply: DeletePrivateDocument(#' + documentID + ')');

        return;
      });
    });
  }

  /** get private documents
   * @return {Promise}
  */
  fetchPrivateDocuments() {
    const self = this;

    return this.network.then( (network) => {
    // fetch contract
      const contract = network.getContract(self.connectionProfile.config.contractID);

      console.log('> fetching documents');

      // enable filter to execute query on our MSP
      const onMSP = this.connectionProfile.organizations[this.connectionProfile.client.organization].mspid;
      network.queryHandler.setFilter(onMSP);

      return contract.evaluateTransaction('FetchPrivateDocuments', ...[]).then( (documents) => {
        // reset filter
        network.queryHandler.setFilter('');

        console.log(documents.toString());

        // check for error
        if (documents == '{}') {
          console.log('> got no results');
          return {};
        }

        return documents.toString();
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
      return network.getChannel().getMsp(mspID);
    });
  }

  /** get signatures for a given storage key
   * @param {Network} network - a fabric network object
   * @param {Contract} contract - a fabric contract object
   * @param {string} storageLocation - a storage location
   * @return {Promise}
  */
  getDocumentID(network, contract, storageLocation) {
    // this will always be run locally
    // enable filter to execute query on our MSP
    const onMSP = this.connectionProfile.organizations[this.connectionProfile.client.organization].mspid;
    network.queryHandler.setFilter(onMSP);

    return contract.evaluateTransaction('GetDocumentID', ...[storageLocation]).then( (response) => {
      const data = JSON.parse(response);
      return data.documentID;
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

        console.log('> INCOMING EVENT: [' + msp + '] <' + event.eventName + '> --> ' + eventDataRaw);

        // resolve documentID from storageLocation if given
        if (eventData.data.storageKey != '') {
          self.getDocumentID(network, contract, eventData.data.storageKey).then( (documentID) => {
            // append documentID to event and notify listeners:
            eventData.data['documentID'] = documentID;
          }).catch( (err) => {
            console.log('ERROR: ' + err);
            // append documentID to event and notify listeners:
            eventData.data['documentID'] = 'could_not_resolve_storage_key';
          }).finally( () => {
            // finally send event
            callback(eventData.eventName, eventData);
          });
        } else {
          // not storageKey in data, publish data as it is
          callback(eventData.eventName, eventData);
        }
      };

      return contract.addContractListener(listener);
    });
  };
}

module.exports = {BlockchainService};
