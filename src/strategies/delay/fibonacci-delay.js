'use strict';

const Delay = require('@emartech/delay-js');

class FibonacciDelay {

  constructor(tries, multiplier = 1) {
    this._multiplier = multiplier;
    [...this._delayInSeconds] = this._fibonacci(tries - 1);
  }

  delay(attempts) {
    const delayInSeconds = this._delayInSeconds[attempts - 1];
    const delayInMilliSeconds = delayInSeconds * 1000 * this._multiplier;
    return Delay.wait(delayInMilliSeconds, delayInSeconds);
  }

  get maxTries() {
    return this._delayInSeconds.length;
  }

  *_fibonacci(n) {
    let current = 1;
    let next = 2;

    while (n--) {
      yield current;
      [current, next] = [next, current + next];
    }
  }
}

module.exports = FibonacciDelay;
