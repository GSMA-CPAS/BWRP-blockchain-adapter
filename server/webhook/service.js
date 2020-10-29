const {v4: uuidv4} = require('uuid');
const debug = require('debug')('bsa:webhook');
const got = require('got');
const fs = require('fs');
const jsonfile = require('jsonfile');

const _db = './webhook_subscriptions.json';

/** constructor
 * @param {string} eventName - name of events to subscribe to
*/
function Webhook() {
  // track subscriptions
  this._subscriptions = _loadSubscriptions(_db);

  this.addSubscription('STORE:SIGNATURE', 'http://localhost:8086/test');
  this.addSubscription('STORE:DOCUMENTHASH', 'http://localhost:8086/test');
}

// add a new subscripton to our list
Webhook.prototype.addSubscription = function(eventName, callbackURL) {
  debug('addSubscription('+eventName+','+callbackURL+')');
  if (typeof callbackURL !== 'string') throw new TypeError('callbackURL must be a string');

  if (!this._subscriptions.hasOwnProperty(eventName)) {
    reject(new Error('unknown eventName ' + eventName + ' specified'));
    return;
  }

  const self = this;
  // find out if this uri is already subscribed:
  // do NOT use forEach, we want to abort and return the first hit
  for (const [uuid, uri] of Object.entries(self._subscriptions[eventName])) {
    if (uri === callbackURL) {
      debug('uri already known, returning old uuid ' + uuid);
      return uuid;
    }
  }

  // uri not yet known, add new subscription
  const uuid = uuidv4();
  self._subscriptions[eventName][uuid] = callbackURL;
  debug(eventName + ' ['+uuid+'] added callback URL >' + callbackURL + '<');
  _storeSubscriptions(_db, self._subscriptions);
  return uuid;
};

// remove a subscripton from our list
Webhook.prototype.removeSubscription = function(uuid) {
  debug('removeSubscription('+uuid+')');
  if (typeof uuid !== 'string') throw new TypeError('uuid must be a string');

  const self = this;
  // forEach runs in parallel, this is ok here
  Object.keys(self._subscriptions).forEach( (eventName) => {
    if (self._subscriptions[eventName].hasOwnProperty(uuid)) {
      delete self._subscriptions[eventName][uuid];
      debug(eventName + ' ['+uuid+'] deleted');
      _storeSubscriptions(_db, self._subscriptions);
    }
  });
};

// iterate through all subscriptions and send the notifications
Webhook.prototype.processEvent = function(eventName, eventData) {
  if (this._subscriptions.hasOwnProperty(eventName)) {
    Object.keys(this._subscriptions[eventName]).forEach( (uuid) => {
      const uri = this._subscriptions[eventName][uuid];
      this.sendNotification(eventName, uuid, uri, eventData);
    });
  };
};

Webhook.prototype.sendNotification = function(eventName, uuid, url, eventData) {
  const self = this;

  debug(eventName + ' ['+uuid+'] sending data to ' + url);

  const options = {
    headers: {'Content-type': 'application/json'},
    retry: {limit: 0},
    body: JSON.stringify(eventData),
  };

  got.post(url, options).then( (response) => {
    debug('['+uuid+'] notification sent.');

    // verify response
    if (response.statusCode == 202) {
      // client sent an ACK, fine
      debug('['+uuid+'] received ACK');
    } else if (response.statusCode == 204) {
      // client sent an NACK
      debug('['+uuid+'] received NACK, removing subscription');
      self.removeSubscription(uuid);
    } else {
      // invalid response
      debug('['+uuid+'] received invalid response code ' + response.statusCode);
    }
  }).catch( (error) => {
    debug('['+uuid+'] ERROR: post request failed: ' + error);
  });
};


Webhook.prototype.getSubscriptions = function() {
  return this._subscriptions;
};

/** _storeSubscriptions
 * @param {string} filename - filename of db
 * @param {object} subscriptions - subscriptions object
*/
function _storeSubscriptions(filename, subscriptions) {
  debug('storing subscription list in file ' + filename);
  jsonfile.writeFileSync(_db, subscriptions, {'spaces': 2});
}

/** _loadSubscriptions
 * @param {string} filename - filename of db
 * @return {object} subscriptions - subscriptions object
*/
function _loadSubscriptions(filename) {
  debug('loading subscription list from file ' + filename);

  try {
    fs.accessSync(filename, fs.R_OK | fs.W_OK);
  } catch (error) {
    if (error.hasOwnProperty('code') && (error.code === 'ENOENT')) {
      const subscriptions = {};

      // init empty lists
      subscriptions['STORE:SIGNATURE'] = {};
      subscriptions['STORE:DOCUMENTHASH'] = {};

      debug('file does not exist. empty subscription initialized');
      return subscriptions;
    } else {
      throw (error);
    }
  }

  const dbObj = jsonfile.readFileSync(filename);
  if (!dbObj) {
    throw Error('failed to read webhook database ' + filename);
  }

  debug('sucessfully loaded subscriptions: ' + JSON.stringify(dbObj));
  return dbObj;
}

module.exports = Webhook;
