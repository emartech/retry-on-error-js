'use strict';

const logger = require('logentries-logformat')('retry-on-error');

const config = require('../config');
const FibonacciDelay = require('./strategies/delay/fibonacci-delay');
const CatchAllErrorHandler = require('./strategies/errorhandler/catch-all');

class RetryOnError {

  static create(generatorFunction, maxTries) {
    return RetryOnError.createWithStrategy(
      generatorFunction,
      new FibonacciDelay(maxTries || config.maxTries),
      new CatchAllErrorHandler()
    );
  }

  static createWithStrategy(generatorFunction, delayStrategy, errorHandlerStrategy) {
    return new RetryOnError(
      generatorFunction,
      delayStrategy,
      errorHandlerStrategy || new CatchAllErrorHandler()
    );
  }

  constructor(generatorFunction, delayStrategy, errorHandlerStrategy) {
    this._delayStrategy = delayStrategy;
    this._errorHandlerStrategy = errorHandlerStrategy;
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
        if (!this._errorHandlerStrategy.canCatch(e)) {
          throw e;
        }

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
        delay: lastDelayTime
      },
      e
    ));
  }
}

module.exports = RetryOnError;
