'use strict';

let DefaultLogger = require('./default-logger');

describe('Default Logger', () => {

  let log;

  beforeEach(function() {
    log = this.sandbox.spy(DefaultLogger, 'logError');
  });

  describe('#maxTries', () => {
    it('should call log function', function() {
      log('test', {});
      expect(log).to.have.been.called;
    });

  });

});
