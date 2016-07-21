'use strict';

const NoDelay = require('./no-delay');

describe('No Delay Strategy', () => {

  describe('#maxTries', () => {

    it('should be a safe integer', function() {
      const subject = new NoDelay();
      const isSafe = Number.isSafeInteger(subject.maxTries);
      expect(isSafe).to.eq(true);
    });

  });

  describe('#delay', () => {

    it('should be resolved quickly', function*() {
      const subject = new NoDelay();
      yield subject.delay();
    });

  });

});
