const {v4: uuidv4} = require('uuid');
const debug = require('debug')('bsa:webhook');
const got = require('got');

/** constructor
 * @param {string} eventName - name of events to subscribe to
*/
function Webhook() {
  // track subscriptions
  this._subscriptions = new Map();
  this._subscriptions.set('STORE:SIGNATURE', new Map());
  this._subscriptions.set('STORE:DOCUMENTHASH', new Map());

  // this._subscriptions.get('STORE:SIGNATURE').set('test-subscriber-for-debugging-only', 'http://localhost:8086/test');
  // this._subscriptions.get('STORE:DOCUMENTHASH').set('test-subscriber-for-debugging-only', 'http://localhost:8086/test');
}

// add a new subscripton to our list
Webhook.prototype.addSubscription = function(eventName, callbackURL) {
  if (typeof callbackURL !== 'string') throw new TypeError('callbackURL must be a string');

  if (!this._subscriptions.has(eventName)) {
    reject(new Error('unknown eventName ' + eventName + ' specified'));
    return;
  }

  const self = this;
  return new Promise(function(resolve, reject) {
    try {
      const uuid = uuidv4();
      self._subscriptions.get(eventName).set(uuid, callbackURL);
      debug(eventName + ' ['+uuid+'] added callback URL >' + callbackURL + '<');
      resolve(uuid);
    } catch (e) {
      reject(e);
    }
  });
};

// remove a subscripton from our list
Webhook.prototype.removeSubscription = function(uuid) {
  if (typeof uuid !== 'string') throw new TypeError('uuid must be a string');

  const self = this;
  return new Promise(function(resolve, reject) {
    self._subscriptions.forEach( (map, eventName, _) => {
      if (map.has(uuid)) {
        self._subscriptions.get(eventName).delete(uuid);
        debug(eventName + ' ['+uuid+'] deleted');
        resolve('removed');
      }
    });

    // not found
    reject(new Error('ERROR: uuid '+uuid+' not known'));
  });
};

// iterate through all subscriptions and send the notifications
Webhook.prototype.processEvent = function(eventName, eventData) {
  if (this._subscriptions.has(eventName)) {
    this._subscriptions.get(eventName).forEach( (url, uuid, _) => {
      // fire and forget...
      this.sendNotification(eventName, uuid, url, eventData);
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

module.exports = Webhook;
