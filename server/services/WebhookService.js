const Service = require('./Service');
const Webhook = require('../webhook/service');
const {BlockchainService} = require('../hyperledger/blockchain_service');

// set up listener for contract events
const webhookService = new Webhook();
const blockchainConnection = new BlockchainService(process.env.BSA_CCP);
// subscribe to events
blockchainConnection.subscribeLedgerEvents( (name, data) => {
  webhookService.processEvent(name, data);
});

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
