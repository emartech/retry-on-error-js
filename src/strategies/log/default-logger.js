'use strict';

const Logger = require('logentries-logformat')('retry-on-error');

class DefaultLogger {
  static logError(e, { attempts, lastDelayTime, context = {} }) {
    const logObject = Object.assign({},
      {
        attempt: attempts,
        delay: lastDelayTime,
        e
      },
      context
    );
    DefaultLogger.callLogWithFlattenProperties(logObject);
  }

  static callLogWithFlattenProperties(logObject = {}) {
    Logger.log('retry', logObject);
  }

}

module.exports = DefaultLogger;
