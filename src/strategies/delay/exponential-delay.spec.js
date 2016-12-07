'use strict';

const Delay = require('@emartech/delay-js');
const ExponentialDelay = require('./exponential-delay');

describe('Exponential Strategy', () => {

  describe('#maxTries', () => {

    it('should set up max tries properly', function() {
      const subject = new ExponentialDelay(3);

      expect(subject.maxTries).to.eq(2);
    });

  });

  describe('#delay', () => {

    it('should wait on retry', function*() {
      const subject = new ExponentialDelay(3);
      this.disableDelay();

      yield subject.delay(2);

      expect(Delay.wait).to.have.been.calledWith(2000, 2);
    });

  });

  describe('#delay with multiplier', () => {

    it('should wait on retry', function*() {
      const subject = new ExponentialDelay(3, 10);
      this.disableDelay();

      yield subject.delay(1);
      yield subject.delay(2);

      expect(Delay.wait.firstCall.args).to.eql([10000, 10]);
      expect(Delay.wait.secondCall.args).to.eql([20000, 20]);
    });

  });


  describe('#delay with multiplier and exponential', () => {

    it('should wait on retry', function*() {
      const subject = new ExponentialDelay(3, 2, 3);
      this.disableDelay();

      yield subject.delay(1);
      yield subject.delay(2);

      expect(Delay.wait.firstCall.args).to.eql([2000, 2]);
      expect(Delay.wait.secondCall.args).to.eql([6000, 6]);
    });

  });

});
