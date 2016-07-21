'use strict';

const Delay = require('@emartech/delay-js');

class FibonacciDelay {

  constructor(tries) {
    [...this._delayInSeconds] = this._fibonacci(tries - 1);
  }

  delay(attempts) {
    const delayInMilliSeconds = this._delayInSeconds[attempts - 1] * 1000;
    return Delay.wait(delayInMilliSeconds, delayInMilliSeconds);
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
