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
        for (const peer of peers) {
          // check connection status
          peer.checkConnection().then( (connected) => {
            // console.log('>' + peer.name + '  status ' + connected + 'PREV='+prevConnected);

            // if one of the peers is "down", shut down this application
            if (!connected) {
              console.log('> FATAL ERROR: peer ' + peer.name + ' is down!');
            }

            // need to reconnect event listner?
            if ((!prevConnected) && (connected)) {
              console.log('> ' + peer.name + ' is ready again. -> RESUBSCRIBING to chaincode events!');
              blockchainConnection.subscribeLedgerEvents(eventCB);
            }
            prevConnected = connected;
          });
        }
      });
    },
    10 * 1000);

/** Subscribes  a client to receive the specified event
   * @param {SubscriptionRequest} subscriptionRequest - the subscription request
   * @return {string}
  */
const webhooksSubscribePOST = ({subscriptionRequest}) => new Promise(
    async (resolve, reject) => {
      webhookService.addSubscription(subscriptionRequest.eventName, subscriptionRequest.callbackUrl).then( (uuid) => {
        resolve(Service.successResponse(uuid, 201));
      }, (error) => {
        reject(Service.rejectResponse({'message': error.toString()}, 500));
      });
    },
);


/** unsubscribes a client from the specified event
   * @param {string} subscriptionID - the uuid of the subscription to remove
   * @return {empty}
  */
const webhooksSubscriptionIDDELETE = ({subscriptionID}) => new Promise(
    async (resolve, reject) => {
      webhookService.removeSubscription(subscriptionID).then( () => {
        resolve(Service.successResponse('', 200));
      }, (error) => {
        reject(Service.rejectResponse({'message': error.toString()}, 500));
      });
    },
);

module.exports = {
  webhooksSubscribePOST,
  webhooksSubscriptionIDDELETE,
};
