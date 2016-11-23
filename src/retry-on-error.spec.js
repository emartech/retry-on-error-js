'use strict';

const Delay = require('@emartech/delay-js');

const RetryOnError = require('./retry-on-error');
const ExponentialDelay = require('./strategies/delay/exponential-delay');
const DefaultLogger = require('./strategies/log/default-logger');

describe('Retry On Error', () => {
  let fn;

  const getSubject = () => RetryOnError.create(fn, 5);

  beforeEach(function() {
    fn = this.sandbox.stub();

    this.disableDelay();
  });

  describe('#run', () => {
    it('should call once', function*() {
      fn.resolves();

      yield getSubject().run();

      expect(fn).to.have.been.calledOnce;
    });

    it('should call thrice', function*() {
      fn.onFirstCall().rejects(new Error());
      fn.onSecondCall().rejects(new Error());
      fn.onThirdCall().resolves();

      yield getSubject().run();

      expect(fn).to.have.been.calledThrice;
    });

    it('should throw error after 5 retries', function*() {
      fn.rejects(new Error('some error'));

      try {
        yield getSubject().run();
      } catch (e) {
        expect(e.message).to.eql('some error');
        expect(fn).to.have.been.callCount(5);
        return;
      }

      throw new Error('error should be thrown');
    });

    it('should throw error after 10 retries', function*() {
      let subject = () => RetryOnError.create(fn, 10);
      fn.rejects(new Error('some error'));

      try {
        yield subject().run();
      } catch (e) {
        expect(e.message).to.eql('some error');
        expect(fn).to.have.been.callCount(10);
        return;
      }

      throw new Error('error should be thrown');
    });

    it('should wait between retries', function*() {
      fn.onCall(0).rejects(new Error());
      fn.onCall(1).rejects(new Error());
      fn.onCall(2).rejects(new Error());
      fn.onCall(3).rejects(new Error());
      fn.onCall(4).resolves();

      yield getSubject().run();

      expect(Delay.wait).to.have.been.callCount(4);
      expect(Delay.wait).to.have.been.calledWith(1000);
      expect(Delay.wait).to.have.been.calledWith(2000);
      expect(Delay.wait).to.have.been.calledWith(3000);
      expect(Delay.wait).to.have.been.calledWith(5000);
    });

    it('should call thrice using an injected delay strategy', function*() {
      const delayStrategy = {
        delay: this.sandbox.stub().resolves(),
        get maxTries() {
          return 3;
        }
      };
      const subject = RetryOnError.createWithStrategy(fn, { delayStrategy });

      fn.onFirstCall().rejects(new Error());
      fn.onSecondCall().rejects(new Error());
      fn.onThirdCall().resolves();

      yield subject.run();

      expect(fn).to.have.been.calledThrice;
      expect(delayStrategy.delay).to.have.been.calledTwice;
    });

    it('should use the injected error handler strategy', function*() {
      const delayStrategy = {
        delay: this.sandbox.stub().resolves(),
        get maxTries() {
          return 10;
        }
      };
      const errorHandlerStrategy = {
        canCatch: this.sandbox.stub().returns(false)
      };
      const testError = new Error();
      const subject = RetryOnError.createWithStrategy(fn, { delayStrategy, errorHandlerStrategy });

      fn.rejects(testError);

      try {
        yield subject.run();
      } catch (e) {
        expect(e).to.eq(testError);
        expect(fn).to.have.been.calledOnce;
        expect(delayStrategy.delay).not.to.have.been.called;
        expect(errorHandlerStrategy.canCatch).to.have.been.calledOnce;
        return;
      }

      throw new Error('Error expected');
    });

    it('should log failed attempt', function*() {
      this.sandbox.stub(DefaultLogger, 'logError');

      const testError = new Error('always fail');
      const subject = RetryOnError.createWithStrategy(
        function*() { throw testError; },
        { delayStrategy: new ExponentialDelay(2) }
      );

      try {
        yield subject.run();
      } catch (e) {
        expect(DefaultLogger.logError).to.have.been.calledTwice;
        expect(DefaultLogger.logError).to.have.been.calledWith(testError, {
          attempts: 1,
          lastDelayTime: 0
        });
      }
    });
  });
});
