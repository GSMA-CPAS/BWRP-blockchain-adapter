
/** ErrorCode implements a custom error class */
class ErrorCode extends Error {
  /** process a chaincode error, parse the response and return a proper error
  * @param {string} code - the error code
  * @param {string} message - the error message that should be forwareded to the user
  */
  constructor(code, message) {
    super(message);
    this.code = code;
    // add this for nicer toString() prints:
    this.name = code;
  }

  /** process any error, parse the response and return a proper error type
  * @param {string} error - the error
  * @param {string} userMessage - the error message that should be forwareded to the user
  * @return {ErrorCode} a new ErrorCode
  */
  static fromError(error, userMessage) {
    // try to decode the error message
    // note: ideally i would assume go chaincode and node sdk can deliver the proper error message
    //       however, i did not find an easy way to pass a proper error from go to node?!

    // decide if it this is a chaincode/fabric error:
    if (error.message.charAt(0) == '{') {
      // this looks like out custom chaincode error, lets try to decode it:

      let code = 'UNDEFINED';

      try {
        const reply = JSON.parse(error.message);
        // msg was parsed, craft custom error:
        code = reply.code;
        // always show full error on log:
        console.log('ERROR: ' +code + ' ' + userMessage + ', origin error was: ' + reply.message);
      } catch (error) {
        // failed to parse, abort here
        code = 'ERROR_BAD_JSON';
        userMessage = 'failed to parse json: can not parse error return value. see blockchain adapter log!';
        console.log('ERROR: '+code+' failed to parse error payload -'+error.message+'- as json:');
        console.log(error);
      }

      // forward to application for further processing
      return new ErrorCode(code, userMessage);
    } else {
      // fabric error
      const code = 'ERROR_INTERNAL';
      console.log('ERROR: '+code+', '+userMessage+': fabric produced the following error: ');
      console.log(error);
      return new ErrorCode(code, userMessage);
    }
  }
}

module.exports = {ErrorCode};
