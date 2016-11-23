'use strict';

const config = require('../config');
const FibonacciDelay = require('./strategies/delay/fibonacci-delay');
const ExponentialDelay = require('./strategies/delay/exponential-delay');
const CatchAllErrorHandler = require('./strategies/errorhandler/catch-all');
const DefaultLogger = require('./strategies/log/default-logger');

class RetryOnError {

  static create(generatorFunction, maxTries) {
    return RetryOnError.createWithStrategy(
      generatorFunction,
      {
        delayStrategy: new FibonacciDelay(maxTries || config.maxTries),
        errorHandlerStrategy: new CatchAllErrorHandler(),
        logStrategy: DefaultLogger.logError
      }
    );
  }

  static createWithStrategy(generatorFunction, { delayStrategy, errorHandlerStrategy, logStrategy }) {
    return new RetryOnError(
      generatorFunction,
      delayStrategy || new FibonacciDelay(config.maxTries),
      errorHandlerStrategy || new CatchAllErrorHandler(),
      logStrategy || DefaultLogger.logError
    );
  }

  static *runExponential(generatorFunction, { maxTries = 5, exponentialBase = 2, multiplier = 5, logStrategy = DefaultLogger.logError}) {
    const retry = RetryOnError.createWithStrategy(generatorFunction, {
      delayStrategy: new ExponentialDelay(maxTries, multiplier, exponentialBase),
      errorHandlerStrategy: new CatchAllErrorHandler(),
      logStrategy: logStrategy
    });

    return yield retry.run();
  }

  constructor(generatorFunction, delayStrategy, errorHandlerStrategy, logStrategy) {
    this._delayStrategy = delayStrategy;
    this._errorHandlerStrategy = errorHandlerStrategy;
    this._logStrategy = logStrategy;
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
        this._logStrategy(e, { attempts, lastDelayTime });

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
