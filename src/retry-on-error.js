'use strict';

const config = require('../config');
const FibonacciDelay = require('./strategies/delay/fibonacci-delay');
const CatchAllErrorHandler = require('./strategies/errorhandler/catch-all');
const DefaultLogger = require('./log/default-logger');

class RetryOnError {

  static create(generatorFunction, maxTries) {
    return RetryOnError.createWithStrategy(
      generatorFunction,
      {
        delayStrategy: new FibonacciDelay(maxTries || config.maxTries),
        errorHandlerStrategy: new CatchAllErrorHandler(),
        logFunction: DefaultLogger.logError
      }
    );
  }

  static createWithStrategy(generatorFunction, { delayStrategy, errorHandlerStrategy, logFunction }) {
    return new RetryOnError(
      generatorFunction,
      delayStrategy || new FibonacciDelay(config.maxTries),
      errorHandlerStrategy || new CatchAllErrorHandler(),
      logFunction || DefaultLogger.logError
    );
  }

  constructor(generatorFunction, delayStrategy, errorHandlerStrategy, logFunction) {
    this._delayStrategy = delayStrategy;
    this._errorHandlerStrategy = errorHandlerStrategy;
    this._logFunction = logFunction;
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
        this._logFunction(e, { attempts, lastDelayTime });

        if (!this._errorHandlerStrategy.canCatch(e)) {
          throw e;
        }

        wasSuccessful = false;
        if (attempts > this._delayStrategy.maxTries) {
          throw e;
        }

        lastDelayTime = yield this._delayStrategy.delay(attempts);
      }
    } while (!wasSuccessful);
  }
}

module.exports = RetryOnError;
