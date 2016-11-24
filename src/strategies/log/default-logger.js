'use strict';

const logger = require('logentries-logformat')('retry-on-error');

class DefaultLogger {
  static logError(e, { attempts, lastDelayTime, context }) {
    logger.log('retry', Object.assign({},
      {
        attempt: attempts,
        delay: lastDelayTime
      },
      context,
      e
    ));
  }
}

module.exports = DefaultLogger;
