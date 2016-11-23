'use strict';

const Delay = require('@emartech/delay-js');

class ExponentialDelay {
  constructor(tries, multiplier = 2) {
    [...this._delayInSeconds] = this._exponential(tries - 1, multiplier);
  }

  delay(attempts) {
    const delayInSeconds = this._delayInSeconds[attempts - 1];
    const delayInMilliSeconds = delayInSeconds * 1000;
    return Delay.wait(delayInMilliSeconds, delayInSeconds);
  }

  get maxTries() {
    return this._delayInSeconds.length;
  }

  *_exponential(tries, multiplier) {
    let exp = 0;
    while (exp !== tries) {
      yield Math.pow(multiplier, exp++);
    }
  }
}

module.exports = ExponentialDelay;
