'use strict';

const logger = require('logentries-logformat')('report-retry');

const config = require('../config');
const FibonacciDelay = require('./fibonacci-delay');

class RetryOnError {

  static create(generatorFunction, maxTries) {
    return RetryOnError.createWithStrategy(generatorFunction, new FibonacciDelay(maxTries || config.maxTries));
  }

  static createWithStrategy(generatorFunction, delayStrategy) {
    return new RetryOnError(generatorFunction, delayStrategy);
  }

  constructor(generatorFunction, delayStrategy) {
    this._delayStrategy = delayStrategy;
    this.generatorFunction = generatorFunction;
    this.run = this.run.bind(this);
  }

  *run() {
    let attempts = 0;
    let wasSuccessful;
    let lastDelayTime = 0;
    do {
      wasSuccessful = true;
      attempts++;
      try {
        return yield this.generatorFunction();
      } catch (e) {
        wasSuccessful = false;
        if (attempts > this._delayStrategy.maxTries) {
          throw e;
        }

        this._logError(e, attempts, lastDelayTime);
        lastDelayTime = yield this._delayStrategy.delay(attempts);
      }
    } while (!wasSuccessful);
  }

  _logError(e, attempts, lastDelayTime) {
    logger.log('retry', Object.assign({},
      {
        attempt: attempts,
        delay: lastDelayTime,
        errorMessage: e.message,
        errorStack: e.stack
      },
      e
    ));
  }
}

module.exports = RetryOnError;
