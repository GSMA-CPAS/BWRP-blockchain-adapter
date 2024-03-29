// SPDX-FileCopyrightText: 2021 GSMA and all contributors.
//
// SPDX-License-Identifier: Apache-2.0
//
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const {Gateway, Wallets} = require('fabric-network');
const {Discoverer, DiscoveryService} = require('fabric-common');

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

  /** set a cert of the type <type>
  * @param {string} type - the cert type (e.g. "root")
  * @param {string} cert - the root cert
  * @return {Promise}
  */
  setCertificate(type, cert) {
    const self = this;

    return this.network.then( (network) => {
    // fetch contract
      const contract = network.getContract(self.connectionProfile.config.contractID);

      // configure certificate
      console.log('> will configure "'+type+'" certificate');
      // console.log(cert);

      // send transaction
      const tx = contract.createTransaction('SetCertificate');

      return tx.submit(...[type, cert]).then( (_) => {
        return '';
      }).catch( (error) => {
        return Promise.reject(ErrorCode.fromError(error, 'SetCertificate('+type+',' +cert+') failed'));
      });
    });
  }

  /** set a cert of the type <type>
  * @param {string} crl - the pem encoded crl
  * @param {string} certChain - the pem endcoded certificate chain signing the crl
  * @return {Promise}
  */
  submitCRL(crl, certChain) {
    const self = this;

    return this.network.then( (network) => {
    // fetch contract
      const contract = network.getContract(self.connectionProfile.config.contractID);

      console.log('> will submit new crl');

      // send transaction
      const tx = contract.createTransaction('SubmitCRL');

      return tx.submit(...[crl, certChain]).then( (_) => {
        return '';
      }).catch( (error) => {
        return Promise.reject(ErrorCode.fromError(error, 'SubmitCRL('+crl+',' +certChain+') failed'));
      });
    });
  }

  /** store a document
   * @param {Network} network - a fabric network object
   * @param {Contract} contract - a fabric contract object
   * @param {string} onMSP - MSP where to execute this call
   * @param {string} partnerMSP - the partnerMSP
   * @param {string} referenceID - a referenceID of a document
   * @param {string} payload - a bas64 encoded document
   * @return {Promise}
  */
  storePrivateDocument(network, contract, onMSP, partnerMSP, referenceID, payload) {
    console.log('> storing document with id ' + referenceID);

    // enable filter
    network.queryHandler.setFilter(onMSP);

    return contract.evaluateTransaction('StorePrivateDocument', ...[partnerMSP, referenceID, payload]).then( (result) => {
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

  /** publish a reference payload link on the ledger
   * @param {Contract} contract - a fabric contract object
   * @param {string} key - the referencestorage link key
   * @param {string} value - the referencestorage link value
   * @return {Promise}
  */
  publishReferencePayloadLink(contract, key, value) {
    // send transaction
    const tx = contract.createTransaction('PublishReferencePayloadLink');
    console.log('> will store reference payload link ' + key + ' -> ' + value);

    return tx.submit(...[key, value]).then( (timestamp) => {
      return {
        type: 'hlf',
        txId: tx.getTransactionId(),
        timestamp: timestamp,
      };
    }).catch( (error) => {
      return Promise.reject(ErrorCode.fromError(error, 'PublishReferencePayloadLink('+key+',' + value+') failed'));
    });
  }

  /** add a document
   * @param {string} partnerMSP - the partnerMSP
   * @param {string} payload - a bas64 encoded payload (e.g. a document)
   * @return {Promise}
  */
  addDocument(partnerMSP, payload) {
    const self = this;

    return this.network.then( (network) => {
      // fetch contract
      const contract = network.getContract(self.connectionProfile.config.contractID);

      // calc expected hash
      const payloadHash = crypto.createHash('sha256').update(payload).digest('hex');

      // fetch our MSP name
      const fromMSP = self.connectionProfile.organizations[self.connectionProfile.client.organization].mspid;

      // fetch referenceID
      return self.createReferenceID(network, contract).then( (referenceID) => {
        // EVALUATE store document on fromMSP (local)
        return self.storePrivateDocument(network, contract, fromMSP, partnerMSP, referenceID, payload).then( (storedPayloadHash) => {
          // check hash
          if (storedPayloadHash != payloadHash) {
            console.log('ERROR: '+fromMSP + ' stored invalid hash: ' + storedPayloadHash + ' != ' + payloadHash);
            return Promise.reject(ErrorCode.createErrorCode('ERROR_INTERNAL', fromMSP + ' stored invalid hash'));
          }

          // EVALUATE store document on partnerMSP (remote)
          return self.storePrivateDocument(network, contract, partnerMSP, partnerMSP, referenceID, payload).then( (storedPayloadHashPartner) => {
            // check hash
            if (storedPayloadHashPartner != payloadHash) {
              console.log('ERROR: '+partnerMSP + ' stored invalid hash: ' + storedPayloadHashPartner + ' != ' + payloadHash);
              return Promise.reject(ErrorCode.createErrorCode('ERROR_INTERNAL', partnerMSP + ' stored invalid hash'));
            }

            // calculate reference payload Link:
            return self.createReferencePayloadLink(network, contract, referenceID, payloadHash).then( (link) => {
              // publish the link on the ledger
              return self.publishReferencePayloadLink(contract, link.key, link.value).then( (blockchainRef) => {
                // now its safe to access the document!
                return self.fetchPrivateDocument(referenceID);
              });
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

  /** isValidSignature checks an unsubmitted signature for validity
   * @param {Network} network - a fabric network object
   * @param {Contract} contract - a fabric contract object
   * @param {string} signerMSPID - the mspid of the signer
   * @param {string} referenceID - a referenceID of a document
   * @param {string} signatureJSON - the signature object json as string
   * @return {Promise}
  */
  isValidSignature(network, contract, signerMSPID, referenceID, signatureJSON) {
    // fetch our MSP name
    const localMSP = this.connectionProfile.organizations[this.connectionProfile.client.organization].mspid;

    // enable filter
    network.queryHandler.setFilter(localMSP);

    // debug
    console.log('> signature         : ' + signatureJSON);

    // extract object
    const signatureObject = JSON.parse(signatureJSON);

    // fetch referencePayloadLink
    return contract.evaluateTransaction('GetReferencePayloadLink', ...[referenceID]).then( (referencePayloadLink) => {
      // calculate signature payload
      const signaturePayload = crypto.createHash('sha256').update(localMSP + ':' + referenceID + ':' + referencePayloadLink).digest('hex');
      console.log('> signaturePayload  : ' + signaturePayload);

      // check signature
      return contract.evaluateTransaction('IsValidSignature', ...[signerMSPID, signaturePayload, signatureObject.signature, signatureObject.algorithm, signatureObject.certificate]).then( () => {
        // reset filter
        network.queryHandler.setFilter('');

        return;
      });
    });
  };

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

  /** create a reference payload link
   * @param {Network} network - a fabric network object
   * @param {Contract} contract - a fabric contract object
   * @param {referenceID} referenceID - a referenceId
   * @param {payloadHash} payloadHash - the hash over the payload
   * @return {Promise}
  */
  createReferencePayloadLink(network, contract, referenceID, payloadHash) {
    // fetch our MSP name
    const localMSP = this.connectionProfile.organizations[this.connectionProfile.client.organization].mspid;

    // enable filter
    network.queryHandler.setFilter(localMSP);

    return contract.evaluateTransaction('CreateReferencePayloadLink', ...[referenceID, payloadHash]).then( (resultJSON) => {
      // reset filter
      network.queryHandler.setFilter('');

      const result = JSON.parse(resultJSON);

      return {
        key: result[0],
        value: result[1],
      };
    }).catch( (error) => {
      return Promise.reject(ErrorCode.fromError(error, 'CreateReferencePayloadLink() failed'));
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

    return tx.submit(...[storageKey, signature]).then( (timestamp) => {
      console.log('> signature stored. timestamp ' + timestamp + ', txid + ' +tx.getTransactionId());
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
        return self.isValidSignature(network, contract, localMSP, referenceID, signatureJSON).then( () => {
          return self.storeSignature(contract, storageKey, signatureJSON);
        });
      });
    }).catch( (error) => {
      return Promise.reject(ErrorCode.fromError(error, 'signDocument(' + referenceID + ', ...) failed'));
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

  /** verify all signatures for given msp, referenceID, and payloadHash
   * @param {string} referenceID - a referenceID
   * @param {string} signerMSP - the MSP that signed
   * @return {Promise}
  */
  verifySignatures(referenceID, signerMSP) {
    const self = this;

    return this.network.then( (network) => {
      // fetch contract
      const contract = network.getContract(self.connectionProfile.config.contractID);

      // enable filter to execute query on our MSP
      const onMSP = this.connectionProfile.organizations[this.connectionProfile.client.organization].mspid;
      network.queryHandler.setFilter(onMSP);

      // query the contract
      return contract.evaluateTransaction('VerifySignatures', ...[referenceID, signerMSP]).then( (results) => {
        // reset filter
        network.queryHandler.setFilter('');

        console.log('> reply: VerifySignatures(' +referenceID+', '+ signerMSP +') = \n' + JSON.stringify(JSON.parse(results.toString()), null, 4));

        return results.toString();
      }).catch( (error) => {
        return Promise.reject(ErrorCode.fromError(error, 'VerifySignatures(' +referenceID+', '+ signerMSP +') failed'));
      });
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
          return Promise.reject(new ErrorCode('ERROR_REFERENCE_ID_UNKNOWN', 'failed to fetch document with referenceID ' + referenceID));
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

  /** get offchain status of msp
   * @param {string} mspID - the MSP to get the status from
   * @return {Promise} struct with status
  */
  getOffchainStatus(mspID) {
    const self = this;
    return this.network.then( (_) => {
      return this.network.then( (network) => {
        // fetch contract
        const contract = network.getContract(self.connectionProfile.config.contractID);

        // enable filter
        network.queryHandler.setFilter(mspID);

        return contract.evaluateTransaction('CheckOffchainDBConfig', ...[]).then( (_) => {
          // reset filter
          network.queryHandler.setFilter('');

          // done
          console.log('> ' + mspID + ' CheckOffchainDBConfig success');

          return {status: 'OK'};
        });
      });
    }).catch( (error) => {
      console.log(error);
      return Promise.reject(new ErrorCode('ERROR_INTERNAL', 'getOffchainStatus() failed'));
    });
  }

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

  /** get peer status via discovery
   * @return {Promise} struct with peer status
  */
  getBlockchainPeerStatus() {
    const self = this;
    return this.network.then( (network) => {
      const channel = network.getChannel();
      // this is a bit hacky... direct member access is not a good idea in general
      // todo: is there an official way to get this client instance?!
      const client = channel.client;

      // fetch various config bits from the ccp
      const selfID = self.connectionProfile.organizations[self.connectionProfile.client.organization].mspid;
      const selfPeerName = self.connectionProfile.organizations[self.connectionProfile.client.organization].peers[0];
      const selfPeerNetworkConfig = self.connectionProfile.peers[selfPeerName];

      // build endpoint config based on grpcoptions
      const endpointConfig = selfPeerNetworkConfig.grpcOptions;
      // add url and pem
      endpointConfig.url = selfPeerNetworkConfig.url;
      endpointConfig.pem = selfPeerNetworkConfig.tlsCACerts.pem;

      // create the endpoint
      const peerEndpoint = channel.client.newEndpoint(endpointConfig);

      // start discoverer using the client
      const discoverer = new Discoverer('my_discovery', client, selfID);

      // connect to the given peer endpoint
      return discoverer.connect(peerEndpoint).then( (_) => {
        console.log('> got discoverer connection...');
        const discoveryService = new DiscoveryService('be discovery service', channel);

        // build an identity context
        const identityContext = this.gateway.identityContext;
        discoveryService.build(identityContext);
        discoveryService.sign(identityContext);

        // for now only one discoverer
        const discoveryServiceTargets = [discoverer];

        // fetch setting from ccp
        let discoveryAsLocalhost = false;
        if (self.connectionProfile.config.discoveryOptions.asLocalhost != undefined) {
          discoveryAsLocalhost = self.connectionProfile.config.discoveryOptions.asLocalhost;
        }

        const discoveryOptions = {
          asLocalhost: discoveryAsLocalhost,
          requestTimeout: 5000,
          refreshAge: 15000,
          targets: discoveryServiceTargets,
        };

        // execute the discovery request
        return discoveryService.send(discoveryOptions).then(() => {
          console.log('> succeeded to send discovery request');
          return discoveryService.getDiscoveryResults().then( (result) => {
            const response = {};
            for (const [peerID, peerData] of Object.entries(result.peers_by_org)) {
              response[peerID] = {};
              for (const peerStatus of peerData.peers) {
                response[peerID][peerStatus.name] = {};
                response[peerID][peerStatus.name].ledgerHeight = peerStatus.ledgerHeight.toString();
                response[peerID][peerStatus.name].chaincodes = {};
                for (const chaincode of peerStatus.chaincodes) {
                  response[peerID][peerStatus.name].chaincodes[chaincode.name] = chaincode.version;
                }
              }
            }
            return response;
          });
        }).catch( (error) => {
          if (error) {
            console.log('Failed to send discovery request for channel', error);
            discoveryService.close();
          }
        });
      });
    }).catch( (error) => {
      console.log(error);
      return Promise.reject(new ErrorCode('ERROR_INTERNAL', 'getBlockchainPeerStatus() failed'));
    });
  }

  /** get a reference payloadlink from the ledger
   * @param {referenceId} referenceId - a reference Id
   * @return {Promise} referencepayload link
  */
  getReferencePayloadLink(referenceId) {
    const self = this;

    return this.network.then( (network) => {
    // fetch contract
      const contract = network.getContract(self.connectionProfile.config.contractID);

      console.log('> fetching referencepayloadlink for referenceId ' + referenceId);

      // enable filter to execute query on our MSP
      const onMSP = this.connectionProfile.organizations[this.connectionProfile.client.organization].mspid;
      network.queryHandler.setFilter(onMSP);

      return contract.evaluateTransaction('GetReferencePayloadLink', ...[referenceId]).then( (payloadlink) => {
        // reset filter
        network.queryHandler.setFilter('');

        console.log('> got payloadlink: ' + payloadlink.toString());

        return payloadlink.toString();
      }).catch( (error) => {
        return Promise.reject(ErrorCode.fromError(error, 'GetReferencePayloadLink() failed'));
      });
    });
  }
}

module.exports = {BlockchainService};
