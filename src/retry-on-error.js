'use strict';

const logger = require('logentries-logformat')('report-retry');

const Delay = require('@emartech/delay-js');
const config = require('../config');

class RetryOnError {

  static create(generatorFunction, tries) {
    return new RetryOnError(generatorFunction, tries || config.maxTries);
  }

  constructor(generatorFunction, tries) {
    this.generatorFunction = generatorFunction;
    this.run = this.run.bind(this);
    [...this.delayInSeconds] = this.fibonacci(tries - 1);
  }

  *run() {
    let attempts = 0;
    let wasSuccessful;
    do {
      wasSuccessful = true;
      attempts++;
      try {
        return yield this.generatorFunction();
      } catch (e) {
        wasSuccessful = false;
        if (attempts > this.delayInSeconds.length) {
          throw e;
        }

        this._logError(e, attempts);
        yield this.delay(attempts);
      }
    } while (!wasSuccessful);
  }

  delay(attempts) {
    const delayInMilliSeconds = this.delayInSeconds[attempts - 1] * 1000;

    return Delay.wait(delayInMilliSeconds);
  }

  _logError(e, attempts) {
    logger.log('retry', Object.assign({},
      {
        attempt: attempts,
        delay: this.delayInSeconds[attempts - 1],
        errorMessage: e.message,
        errorStack: e.stack
      },
      e
    ));
  }

  *fibonacci(n) {
    let current = 1;
    let next = 2;

    while (n--) {
      yield current;
      [current, next] = [next, current + next];
    }
  }
}

module.exports = RetryOnError;
