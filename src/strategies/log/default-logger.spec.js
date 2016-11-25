'use strict';

let DefaultLogger = require('./default-logger');

describe('Default Logger', () => {

  let log;

  beforeEach(function() {
    log = this.sandbox.spy(DefaultLogger, 'logError');
    this.sandbox.spy(DefaultLogger, 'callLogWithFlattenProperties');
  });

  it('should call log function', function() {
    log('test', {});
    expect(log).to.have.been.called;
  });

  it('should call log function with flattened parameters', function() {
    const attempts = 1;
    const lastDelayTime = 1000;
    const test1 = 'tp1';
    const test2 = 'tp2';

    const context = {
      test1, test2
    };
    const e = new Error('test always fails');

    DefaultLogger.logError(e, { attempts, lastDelayTime, context });

    expect(DefaultLogger.callLogWithFlattenProperties).to.have.been.called;
    expect(DefaultLogger.callLogWithFlattenProperties).to.have.been.calledWithMatch({
      attempt: attempts, delay: lastDelayTime, test1, test2, e
    });
  });

});
