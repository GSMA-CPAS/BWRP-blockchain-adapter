
/* eslint-disable max-len */
console.log('> starting example-client');

const api = require('blockchain-adapter-api');
const btoa = require('btoa');
const crypto = require('crypto');
const {exit} = require('process');
const _ = require('lodash');
const fs = require('fs');
const openssl = require('openssl-nodejs');

// the strange openssl lib needs this dir in order to work
fs.mkdir('openssl', {recursive: true}, (err) => {
  if (err) throw err;
});

const ENDPOINT_DTAG = 'http://localhost:8081';
const ENDPOINT_TMUS = 'http://localhost:8082';

// create a unique document:
// WARNING: btoa() does not seem to work reliable on real binary documents!
const DOCUMENT = (new Date().getTime()).toString();
const DOCUMENT64 = btoa(DOCUMENT);

const DOCUMENTSHA256 = crypto.createHash('sha256').update(DOCUMENT64).digest('hex');
console.log('DOCUMENT      : ' + DOCUMENT);
console.log('DOCUMENT64    : ' + DOCUMENT64);
console.log('DOCUMENTSHA256: ' + DOCUMENTSHA256);

/** configure the offchain db adapter
 * @param {api.ConfigApi} config - configAPI object
 * @param {string} name - name of the org
 * @param {string} uri - URI of the offchain db adapter server
 * @return {undefined}
*/
function setOffchainDBAdapterConfig(config, name, uri) {
  console.log('> ' + name + ': setting offchain db adapter config uri to ' + uri);
  const obdaConfig = new api.OffchainDBAdapterConfig();
  obdaConfig.restURI = uri;
  return config.setOffchainDBAdapterConfig(obdaConfig).then((result) => {
    console.log('> ok. txID = ' + result.body.txID);
  }).catch((e) => {
    console.log('> failed, response body: ' + JSON.stringify(e.response.body));
    exit(1);
  });
}

/** sign a contract document
 * @param {string} signer - name of the signer
 * @param {string} document - a document
 * @return {Promise}
*/
function signContract(signer, document) {
  return new Promise((resolve, reject) => {
    const documentSig = new api.DocumentSignature();
    documentSig.signer = signer;

    // create key
    openssl('openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:secp384r1 -nodes -keyout key_' + signer + ' -out crt -subj /CN=' + signer + '/C=DE/ST=NRW/L=Bielefeld/O=ORG/OU=ORGOU -addext keyUsage=digitalSignature', function(e, b) {
      //
    }).on('close', (code) => {
      if (code != 0) reject(new Error('openssl: failed to create key'));
    });

    // extract pem
    openssl(['x509', '-pubkey', '-in', 'crt'], function(e, b) {
      if ((e) && (e != '')) reject(new Error(e.toString()));
      documentSig.pem = b.toString();

      const docBuf = Buffer.from(document);
      const sigBuf = Buffer.alloc(0);

      openssl(['dgst', '-sha256', '-sign', 'openssl/key_' + signer, '-out', {name: 'signature_' + signer, buffer: sigBuf}, {name: 'doc', buffer: docBuf}], function(e) {
        if ((e) && (e != '')) reject(e.toString());
        // do base64 encoding
        openssl(['enc', '-A', '-base64', '-in', 'signature_' + signer], function(e, b) {
          if ((e) && (e != '')) reject(new Error(e.toString()));
          documentSig.signature = b.toString();
          resolve(documentSig);
        }).on('close', (code) => {
          if (code != 0) reject(new Error('openssl: failed to calc base64'));
        });
      }).on('close', (code) => {
        if (code != 0) reject(new Error('openssl: failed to sign'));
      });
    }).on('close', (code) => {
      if (code != 0) reject(new Error('openssl: failed to extract pem'));
    });
  });
}

/** verify signature
 * @param {string} document - a document
 * @param {string} pem - a public key
 * @param {string} signature64 - a signature in base64
 * @return {Promise}
*/
function verifySignature(document, pem, signature64) {
  console.log('document:    ' + document + '.');
  // console.log('pem:         ' + pem);
  // console.log('signature64: ' + signature64);

  return new Promise((resolve, reject) => {
    const docBuf = Buffer.from(document);
    const pemBuf = Buffer.from(pem);
    const sigBuf = Buffer.from(signature64);


    openssl(['enc', '-d', '-A', '-base64', '-in', {name: 'signature_sig64', buffer: sigBuf}, '-out', 'signature_sig'], function(e, b) {
      if ((e) && (e != '')) reject(new Error(e.toString()));

      openssl(['dgst', '-sha256', '-verify', {name: 'signature_pem', buffer: pemBuf}, '-signature', 'openssl/signature_sig', {name: 'signature_doc', buffer: docBuf}], function(e, b) {
        if ((e) && (e != '')) reject(new Error(e.toString()));

        resolve(b.toString());
      }).on('close', (code) => {
        if (code != 0) reject(new Error('openssl: failed to verify signature'));
      });
    }).on('close', (code) => {
      if (code != 0) reject(new Error('openssl: failed to calc base64'));
    });
  });
}

const launchClient = async () => {
  const DTAG = {
    config: new api.ConfigApi(ENDPOINT_DTAG),
    contract: new api.ContractApi(ENDPOINT_DTAG),
  };
  const TMUS = {
    config: new api.ConfigApi(ENDPOINT_TMUS),
    contract: new api.ContractApi(ENDPOINT_TMUS),
  };

  try {
    console.log('> configuring offchain-db-adapter uris');
    await setOffchainDBAdapterConfig(DTAG.config, 'DTAG', 'http://offchain-db-adapter-dtag:3333');
    await setOffchainDBAdapterConfig(TMUS.config, 'TMUS', 'http://offchain-db-adapter-tmus:3334');

    console.log('> storing document on both parties by calling the function on DTAG with the partner id TMUS');
    privateDocument = new api.PrivateDocument();
    privateDocument.toMSP = 'TMUS';
    privateDocument.data = DOCUMENT64;

    const documentID = await DTAG.contract.uploadPrivateDocument(privateDocument).then( (res) => {
      const id = res.response.body.documentID;
      console.log('> done. stored with ID ' + id);
      return id;
    });

    console.log('> dtag signs contract');
    let documentSignature = await signContract('user@dtag', DOCUMENT64);
    await DTAG.contract.uploadSignature(documentID, documentSignature).then( (res) => {
      console.log('> done. txid ' + res.response.body.txID);
    });

    console.log('> tmus signs contract');
    documentSignature = await signContract('user@tmus', DOCUMENT64);
    await TMUS.contract.uploadSignature(documentID, documentSignature).then( (res) => {
      console.log('> done. txid ' + res.response.body.txID);
    });

    console.log('> fetching document from dtag');
    const resDTAG = await DTAG.contract.fetchPrivateDocument(documentID);
    const doc = resDTAG.body;
    console.log('> ' + doc.timestamp + ': ' + doc.fromMSP + ' -> ' + doc.toMSP + ', document data b64 = ' + doc.dataHash);

    console.log('> fetching tmus signatures');
    const resTMUS = await DTAG.contract.fetchSignatures(documentID, 'TMUS');
    const sig = resTMUS.body;

    _.each(sig, function(entry, key) {
      console.log('> verifying signature[' + key + '] = ' + entry.signature);
      verifySignature(doc.data, entry.pem, entry.signature).then( (result) => {
        console.log('> result: ' + result);
      }).catch((x) => {
        console.log(' FAILED: ' + x);
      });
    });
  } catch (err) {
    if ((err.body) && (err.body.message)) {
      console.log(err.body.message);
    } else {
      console.error('ERROR: >' + err + '<');
    }
  };
};

launchClient().catch( (e) => console.log(e));
