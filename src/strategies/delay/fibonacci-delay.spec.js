'use strict';

const Delay = require('@emartech/delay-js');
const FibonacciDelay = require('./fibonacci-delay');

describe('Exponential Strategy', () => {

  describe('#maxTries', () => {

    it('should set up max tries properly', function() {
      const subject = new FibonacciDelay(3);

      expect(subject.maxTries).to.eq(2);
    });

  });

  describe('#delay', () => {

    it('should wait on retry', function*() {
      const subject = new FibonacciDelay(3);
      this.disableDelay();

      yield subject.delay(2);

      expect(Delay.wait).to.have.been.calledWith(2000, 2);
    });

  });

  describe('#delay with _multiplier', () => {

    it('should wait on retry', function*() {
      const subject = new FibonacciDelay(3, 10);
      this.disableDelay();

      yield subject.delay(2);

      expect(Delay.wait).to.have.been.calledWith(20000, 2);
    });

  });

});
