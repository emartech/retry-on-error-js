'use strict';

const Delay = require('@emartech/delay-js');

class ExponentialDelay {
  constructor(tries, multiplier = 1, exponentialBase = 2) {
    this._multiplier = multiplier;
    [...this._delayInSeconds] = this._exponential(tries - 1, exponentialBase);
  }

  delay(attempts) {
    const delayInSeconds = this._delayInSeconds[attempts - 1];
    const delayInMilliSeconds = delayInSeconds * 1000 * this._multiplier;
    return Delay.wait(delayInMilliSeconds, delayInSeconds);
  }

  get maxTries() {
    return this._delayInSeconds.length;
  }

  *_exponential(tries, exponentialBase) {
    let exp = 0;
    while (exp !== tries) {
      yield Math.pow(exponentialBase, exp++);
    }
  }
}

module.exports = ExponentialDelay;
