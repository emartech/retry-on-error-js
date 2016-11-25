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

  static createWithStrategy(generatorFunction, { delayStrategy, errorHandlerStrategy, logStrategy, context }) {
    return new RetryOnError(
      generatorFunction,
      delayStrategy || new FibonacciDelay(config.maxTries),
      errorHandlerStrategy || new CatchAllErrorHandler(),
      logStrategy || DefaultLogger.logError,
      context || { }
    );
  }

  static *runExponential(
    generatorFunction,
    context = { },
    {
      maxTries = 5,
      exponentialBase = 2,
      multiplier = 5,
      logStrategy = DefaultLogger.logError
    } = {}
  ) {
    const retry = RetryOnError.createWithStrategy(generatorFunction, {
      delayStrategy: new ExponentialDelay(maxTries, multiplier, exponentialBase),
      logStrategy: logStrategy,
      context: context
    });
    return yield retry.run();
  }

  static *runFibonacci(
    generatorFunction,
    context = { },
    {
      maxTries = 5,
      multiplier = 5,
      logStrategy = DefaultLogger.logError
    } = {}
  ) {
    const retry = RetryOnError.createWithStrategy(generatorFunction, {
      delayStrategy: new FibonacciDelay(maxTries, multiplier),
      logStrategy: logStrategy,
      context: context
    });
    return yield retry.run();
  }

  static *runConstant(
    generatorFunction,
    context = { },
    {
      maxTries = 5,
      multiplier = 5,
      logStrategy = DefaultLogger.logError
    } = {}
  ) {
    const retry = RetryOnError.createWithStrategy(generatorFunction, {
      delayStrategy: new ExponentialDelay(maxTries, multiplier, 1),
      logStrategy: logStrategy,
      context: context
    });
    return yield retry.run();
  }

  constructor(generatorFunction, delayStrategy, errorHandlerStrategy, logStrategy, context) {
    this._delayStrategy = delayStrategy;
    this._errorHandlerStrategy = errorHandlerStrategy;
    this._logStrategy = logStrategy;
    this._context = context;
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

        this._logStrategy(e, { attempts, lastDelayTime, context: this._context });

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
