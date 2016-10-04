'use strict';

const CatchAllErrorHandlerStrategy = require('./catch-all');

describe('Catch All error handler strategy', () => {

  describe('#canCatch', () => {
    it('should catch a standard error', () => {
      const errorToTest = new Error('some msg');
      const subject = CatchAllErrorHandlerStrategy.create();

      const result = subject.canCatch(errorToTest);

      expect(result).to.eq(true);
    });
  });
});
