// SPDX-FileCopyrightText: 2021 GSMA and all contributors.
//
// SPDX-License-Identifier: Apache-2.0
//
const Service = require('./Service');
const Webhook = require('../webhook/service');
const {BlockchainService} = require('../hyperledger/blockchain_service');

// set up listener for contract events
const webhookService = new Webhook();
const blockchainConnection = new BlockchainService(process.env.BSA_CCP);

// define callback
const eventCB = function(name, data) {
  webhookService.processEvent(name, data);
};

// subscribe to events
blockchainConnection.subscribeLedgerEvents(eventCB);

// keep track of the peer status and reinstall listener if needed
// FIXME: is there really no other way in hyperledger 2.x to
//        attach an event listener that is not being removed when a peer
//        disconnects and reconnects?
prevConnected = true;
setInterval(
    function() {
      blockchainConnection.network.then( (network) => {
        // filter by given mspID (ours...)
        const localMSP = blockchainConnection.connectionProfile.organizations[blockchainConnection.connectionProfile.client.organization].mspid;
        const peers = network.getChannel().getEndorsers(localMSP);

        // check all peers
        let nowConnected = true;
        connectedPromises = [];
        for (const peer of peers) {
          // check connection status
          connectedPromises.push(peer.checkConnection());
        }

        Promise.all(connectedPromises).then( (result) => {
          for (i in result) {
            if (!result[i]) {
              console.log('> FATAL ERROR: peer ' + peers[i].name + ' is down! connected = ' + result[i]);
              nowConnected = false;
            }
          }

          // do we need to reconnect the event listener?
          if ((!prevConnected) && (nowConnected)) {
          // previous status was disconnected, now connected again:
            console.log('> connection restored -> RESUBSCRIBING to chaincode events!');
            blockchainConnection.subscribeLedgerEvents(eventCB);
          }

          prevConnected = nowConnected;
        }).catch( (error) => {
          console.log('Error checking connection status: ' + error);
        });
      });
    },
    10 * 1000);

/** Subscribes  a client to receive the specified event
   * @param {SubscriptionRequest} subscriptionRequest - the subscription request
   * @return {string}
  */
const webhooksSubscribePOST = ({subscriptionRequest}) => new Promise(
    async (resolve, reject) => {
      try {
        const uuid = webhookService.addSubscription(subscriptionRequest.eventName, subscriptionRequest.callbackUrl);
        resolve(Service.successResponse(uuid, 201));
      } catch (error) {
        reject(Service.rejectResponse({'message': error.toString()}, 500));
      }
    },
);


/** unsubscribes a client from the specified event
   * @param {string} subscriptionID - the uuid of the subscription to remove
   * @return {empty}
  */
const webhooksSubscriptionIDDELETE = ({subscriptionID}) => new Promise(
    async (resolve, reject) => {
      try {
        webhookService.removeSubscription(subscriptionID);
        resolve(Service.successResponse('', 200));
      } catch (error) {
        reject(Service.rejectResponse({'message': error.toString()}, 500));
      }
    },
);


/** show all subscriptions
*
* @return {string} JSON string describing all subscriptions
* */
const webhooksGET = () => new Promise(
    async (resolve, reject) => {
      try {
        const subscriptions = webhookService.getSubscriptions();
        resolve(Service.successResponse(subscriptions, 200));
      } catch (error) {
        reject(Service.rejectResponse({'message': error.toString()}, 500));
      }
    },
);

module.exports = {
  webhooksSubscribePOST,
  webhooksSubscriptionIDDELETE,
  webhooksGET,
};
