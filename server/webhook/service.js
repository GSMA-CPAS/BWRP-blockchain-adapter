const {v4: uuidv4} = require('uuid');
const debugx = require('debug')('bsa:webhook');
const got = require('got');

/** constructor
*/
function Webhook() {
  // track subscriptions
  this._subscriptions = new Map();
  this._subscriptions['TEST-SUB'] = 'http://localhost:8086/test';
}

// add a new subscripton to our list
Webhook.prototype.addSubscription = function(callbackURL) {
  if (typeof callbackURL !== 'string') throw new TypeError('callbackURL must be a string');

  const self = this;
  return new Promise(function(resolve, reject) {
    try {
      const uuid = uuidv4(); ;
      self._subscriptions[uuid] = callbackURL;
      debugx('['+uuid+'] added callback URL >' + callbackURL + '<');
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
    if (self._subscriptions.has(uuid)) {
      self._subscriptions.delete(uuid);
      resolve('removed');
    } else {
      reject(new Error('ERROR: uuid '+uuid+' not known'));
    }
  });
};

// iterate through all subscriptions and send the notifications
Webhook.prototype.processEvent = function(eventData) {
  for (const [uuid, callbackURL] of Object.entries(this._subscriptions)) {
    // fire and forget...
    const url = callbackURL;
    this.sendNotification(uuid, url, eventData);
  }
};

Webhook.prototype.sendNotification = function(uuid, url, eventData) {
  debugx('['+uuid+'] sending data to ' + url);

  const options = {
    headers: {'Content-type': 'application/json'},
    retry: {limit: 0},
    body: JSON.stringify(eventData),
  };

  got.post(url, options).then( (body) => {
    debugx('['+uuid+'] notification sent.');
  }).catch( (error) => {
    debugx('['+uuid+'] ERROR: post request failed: ' + error);
  });
};

module.exports = Webhook;
