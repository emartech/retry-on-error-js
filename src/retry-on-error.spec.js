'use strict';

const Delay = require('@emartech/delay-js');

const RetryOnError = require('./retry-on-error');


describe('Retry On Error', () => {
  let fn;

  const getSubject = () => RetryOnError.create(fn, 5);

  beforeEach(function() {
    fn = this.sandbox.stub();

    this.disableDelay();
  });

  describe('run', () => {
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

    it('should call thrice using an injected strategy', function*() {
      const strategy = {
        delay: this.sandbox.stub().resolves(),
        get maxTries() {
          return 3;
        }
      };
      const subject = RetryOnError.createWithStrategy(fn, strategy);

      fn.onFirstCall().rejects(new Error());
      fn.onSecondCall().rejects(new Error());
      fn.onThirdCall().resolves();

      yield subject.run();

      expect(fn).to.have.been.calledThrice;
      expect(strategy.delay).to.have.been.calledTwice;
    });
  });
});
