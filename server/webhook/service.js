const { v4: uuidv4 } = require('uuid');
var debugx = require('debug')('bsa:webhook');
const got = require('got');


function Webhook () {
  // track subscriptions
  this._subscriptions = new Map();
  this._subscriptions['TEST-SUB'] = 'http://localhost:8086/test';
}


// http://localhost:8085/signatures/subscribe?callbackUrl=http%3A%2F%2Flocalhost%3A8086%2Fpath

// add a new subscripton to our list
Webhook.prototype.addSubscription = function (callbackURL) {
  if (typeof callbackURL !== 'string') throw new TypeError('callbackURL must be a string');
  
  var self = this;
  return new Promise(function (resolve, reject) {
    try {
      const uuid = uuidv4();;
      self._subscriptions[uuid] = callbackURL;
      debugx('['+uuid+'] added callback URL >' + callbackURL + '<');
      resolve(uuid);
    } catch (e) {
      reject(e);
    }
  });
}

// remove a subscripton from our list
Webhook.prototype.removeSubscription = function (uuid) {
  if (typeof uuid !== 'string') throw new TypeError('uuid must be a string');
  
  var self = this;
  return new Promise(function (resolve, reject) {
    if (self._subscriptions.has(uuid)) {
      self._subscriptions.delete(uuid);
      resolve('removed');
    } else {
      reject('ERROR: uuid '+uuid+' not known');
    }
  });
}

// iterate through all subscriptions and send the notifications
Webhook.prototype.processEvent = function (eventData) {
  for (const [uuid, callbackURL] of Object.entries(this._subscriptions)) {
    // fire and forget...
    const url = callbackURL;
    this.sendNotification(uuid, url, eventData);
  }
}

Webhook.prototype.sendNotification = function(uuid, url, eventData){
  debugx('['+uuid+'] sending data to ' + url);
  
  var options = {
    headers: { 'Content-type': 'application/json'},
    retry: { limit: 0 },
    body: JSON.stringify(eventData),
  };

  got.post(url, options).then( (body) => {
    debugx('['+uuid+'] notification sent.');
  }).catch( (error) => {
    debugx('['+uuid+'] ERROR: post request failed: ' + error);
  });
}

module.exports = Webhook;