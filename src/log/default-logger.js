'use strict';

const logger = require('logentries-logformat')('retry-on-error');

class DefaultLogger {
  static logError(e, { attempts, lastDelayTime }) {
    logger.log('retry', Object.assign({},
      {
        attempt: attempts,
        delay: lastDelayTime
      },
      e
    ));
  }
}

module.exports = DefaultLogger;
