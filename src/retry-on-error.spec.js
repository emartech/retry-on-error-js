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
  });

  describe('#run', () => {
    beforeEach(function() {
      this.disableDelay();
    });

    it('should call once', async function() {
      fn.resolves();

      await getSubject().run();

      expect(fn).to.have.been.calledOnce;
    });

    it('should call thrice', async function() {
      fn.onFirstCall().rejects(new Error());
      fn.onSecondCall().rejects(new Error());
      fn.onThirdCall().resolves();

      await getSubject().run();

      expect(fn).to.have.been.calledThrice;
    });

    it('should throw error after 5 retries', async function() {
      fn.rejects(new Error('some error'));

      try {
        await getSubject().run();
      } catch (e) {
        expect(e.message).to.eql('some error');
        expect(fn).to.have.been.callCount(5);
        return;
      }

      throw new Error('error should be thrown');
    });

    it('should throw error after 10 retries', async function() {
      let subject = () => RetryOnError.create(fn, 10);
      fn.rejects(new Error('some error'));

      try {
        await subject().run();
      } catch (e) {
        expect(e.message).to.eql('some error');
        expect(fn).to.have.been.callCount(10);
        return;
      }

      throw new Error('error should be thrown');
    });

    it('should wait between retries', async function() {
      fn.onCall(0).rejects(new Error());
      fn.onCall(1).rejects(new Error());
      fn.onCall(2).rejects(new Error());
      fn.onCall(3).rejects(new Error());
      fn.onCall(4).resolves();

      await getSubject().run();

      expect(Delay.wait).to.have.been.callCount(4);
      expect(Delay.wait).to.have.been.calledWith(1000);
      expect(Delay.wait).to.have.been.calledWith(2000);
      expect(Delay.wait).to.have.been.calledWith(3000);
      expect(Delay.wait).to.have.been.calledWith(5000);
    });

    it('should call thrice using an injected delay strategy', async function() {
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

      await subject.run();

      expect(fn).to.have.been.calledThrice;
      expect(delayStrategy.delay).to.have.been.calledTwice;
    });

    it('should use the injected error handler strategy', async function() {
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
        await subject.run();
      } catch (e) {
        expect(e).to.eq(testError);
        expect(fn).to.have.been.calledOnce;
        expect(delayStrategy.delay).not.to.have.been.called;
        expect(errorHandlerStrategy.canCatch).to.have.been.calledOnce;
        return;
      }

      throw new Error('Error expected');
    });

    it('should log failed attempt', async function() {
      this.sandbox.stub(DefaultLogger, 'logError');

      const testError = new Error('always fail');
      const subject = RetryOnError.createWithStrategy(
        async function() {
          throw testError;
        },
        { delayStrategy: new ExponentialDelay(2) }
      );

      try {
        await subject.run();
      } catch (e) {
        expect(DefaultLogger.logError).to.have.been.calledTwice;
        expect(DefaultLogger.logError).to.have.been.calledWithMatch(testError, {
          attempts: 1,
          lastDelayTime: 0
        });
      }
    });
  });

  describe('#static test runners', function() {
    const retryRunners = {
      '#runExponential': RetryOnError.runExponential,
      '#runFibonacci': RetryOnError.runFibonacci,
      '#runConstant': RetryOnError.runConstant
    };

    const expectedDelays = {
      '#runExponential': [0, 1000, 2000, 4000, 8000],
      '#runFibonacci': [0, 1000, 2000, 3000, 5000],
      '#runConstant': [0, 1000, 1000, 1000, 1000]
    };

    const retryRunnerTesterFactory = function(runnerName, retryRunner, delays) {
      return function() {
        describe('with disable delay', () => {
          beforeEach(function() {
            this.disableDelay();
          });

          it('should call successful function once', async function() {
            fn.resolves();

            await retryRunner(fn);

            expect(fn).to.have.been.calledOnce;
          });

          it('should call rejected function thrice', async function() {
            const testError = new Error();
            const config = {
              maxTries: 3
            };
            fn.onFirstCall().rejects(testError);
            fn.onSecondCall().rejects(testError);
            fn.onThirdCall().resolves();

            await retryRunner(fn, {}, config);

            expect(fn).to.have.been.calledThrice;
          });

          it('should return appropriate value', async function() {
            const config = {
              maxTries: 2
            };
            fn.onFirstCall().rejects(new Error());
            fn.onSecondCall().resolves(2);

            const result = await retryRunner(fn, {}, config);

            expect(fn).to.have.been.calledTwice;
            expect(result).to.eq(2);
          });

          it(`should use ${runnerName} delay strategy`, async function() {
            fn.onCall(0).rejects(new Error());
            fn.onCall(1).rejects(new Error());
            fn.onCall(2).rejects(new Error());
            fn.onCall(3).rejects(new Error());
            fn.onCall(4).resolves();
            const config = {
              maxTries: 5,
              multiplier: 1
            };

            await retryRunner(fn, {}, config);

            expect(Delay.wait).to.have.been.callCount(4);
            for (let i = 1; i < delays.length; i++) {
              expect(Delay.wait).to.have.been.calledWith(delays[i]);
            }
          });

          it('should throw error after 5 retries', async function() {
            fn.rejects(new Error('always fails'));
            const config = {
              maxTries: 5
            };

            try {
              await retryRunner(fn, {}, config);
              throw new Error('error should be thrown');
            } catch (e) {
              expect(e.message).to.eql('always fails');
              expect(fn).to.have.been.callCount(5);
            }
          });
        });


        it('should log failed attempt, no context', async function() {
          fn.rejects(new Error('always fails'));
          let delayStub = this.sandbox.stub(Delay, 'wait');
          for (let i = 1; i < delays.length; i++) {
            delayStub.onCall(i - 1).resolves(delays[i]);
          }
          this.sandbox.spy(DefaultLogger, 'logError');
          const config = {
            maxTries: 4
          };

          try {
            await retryRunner(fn, {}, config);
          } catch (e) {
            expect(DefaultLogger.logError).to.have.been.callCount(4);
            for (let i = 0; i < delays.length - 1; i++) {
              expect(DefaultLogger.logError).to.have.been.calledWithMatch(e, {
                attempts: i + 1,
                lastDelayTime: delays[i]
              });
            }
          }
        });

        it('should log failed attempt, context', async function() {
          fn.rejects(new Error('always fails'));
          let delayStub = this.sandbox.stub(Delay, 'wait');
          for (let i = 1; i < delays.length; i++) {
            delayStub.onCall(i - 1).resolves(delays[i]);
          }
          this.sandbox.spy(DefaultLogger, 'logError');
          const testproperty1 = 'this is the first test property';
          const testproperty2 = 'this is the second test property';
          const context = {
            testproperty1,
            testproperty2
          };
          const config = {
            maxTries: 4
          };

          try {
            await retryRunner(fn, context, config);
          } catch (e) {
            expect(DefaultLogger.logError).to.have.been.callCount(4);
            for (let i = 0; i < delays.length - 1; i++) {
              expect(DefaultLogger.logError).to.have.been.calledWithMatch(e, {
                attempts: i + 1,
                lastDelayTime: delays[i],
                context
              });
            }
          }
        });
      };
    };

    for (const functionName in retryRunners) {
      describe(functionName, retryRunnerTesterFactory(
        functionName,
        retryRunners[functionName],
        expectedDelays[functionName]
      ));
    }
  });
});
