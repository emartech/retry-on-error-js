'use strict';

const logger = require('logentries-logformat')('retry-on-error');

class DefaultLogger {
  static logError(e, { attempts, lastDelayTime, context = {} }) {
    const logObject = Object.assign({},
      {
        attempt: attempts,
        delay: lastDelayTime
      },
      context,
      e
    );
    logger.log('retry', logObject);
  }
}

module.exports = DefaultLogger;
