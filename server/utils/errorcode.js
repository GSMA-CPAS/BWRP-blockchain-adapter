/** ErrorCode implements a custom error class */
class ErrorCode extends Error {
  /** process a chaincode error, parse the response and return a proper error
  * @param {string} code - the error code
  * @param {string} message - the error message that should be forwareded to the user
  */
  constructor(code, message) {
    super(message);
    this.code = code;
  }


  /** process a chaincode error, parse the response and return a proper error
  * @param {string} errorJSON - the chaincode error (json format)
  * @param {string} userMessage - the error message that should be forwareded to the user
  * @return {ErrorCode} a new ErrorCode
  */
  static fromChaincodeError(errorJSON, userMessage) {
    // try to decode the json error message
    // note: ideally i would assume go chaincode and node sdk can deliver the proper error message
    //       however, i did not find an easy way to pass a proper error from go to node?!
    const msg = errorJSON.message;
    let code = 'UNDEFINED';

    try {
      const reply = JSON.parse(msg);
      // msg was parsed, craft custom error:
      code = reply.code;
      // always show full error on log:
      console.log('ERROR: ' +code + ' ' + userMessage + ', origin error was: ' + reply.message);
    } catch (error) {
    // failed to parse, abort here
      code = 'ERROR_BAD_JSON';
      userMessage = 'failed to parse json: can not parse error return value. see blockchain adapter log!';
      console.log('ERROR: '+code+' failed to parse error payload -'+msg+'- as json:');
      console.log(error);
    }

    // forward to application for further processing
    return new ErrorCode(code, userMessage);
  }
}

module.exports = {ErrorCode};
