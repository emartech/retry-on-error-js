# retry-on-error-js

Generator based retry utility.

## Installation

```bash
npm i @emartech/retry-on-error --save
```

## Usage

### Exponential

Wait time: multiplier * exponentialBase ^ n, where n is the try counter. 

```javascript
yield retryOnError.runExponential(
  function*() { return yield Promise.resolve(10); }, // generator function that will run for maxTries time
  { customer_id: 10 }, // additional info that will be logged at every failed retry attempt
  {
    maxTries: 5, // how many times to try running given function
    exponentialBase: 2, // what is the base of exponent for consecutive tries
    multiplier: 5, // what is the basic number that will be multiplied by exponent
    logStrategy: function(e, { attempts, lastDelayTime, context = {} }) {
      // custom log function, default is logentries-logformat
    }
  }
);
```

### Fibonacci

Wait time: multiplier * Fibonacci(n), where n is the try counter.

```javascript
yield retryOnError.runFibonacci(
  function*() { return yield Promise.resolve(10); }, // generator function that will run for maxTries time
  { customer_id: 10 }, // additional info that will be logged at every failed retry attempt
  {
    maxTries: 5, // how many times to try running given function
    multiplier: 5, // what is the basic number that will be multiplied by exponent
    logStrategy: function(e, { attempts, lastDelayTime, context = {} }) {
      // custom log function, default is logentries-logformat
    }
  }
);
```

### Constant

Wait time: multiplier. 

```javascript
yield retryOnError.runConstant(
  function*() { return yield Promise.resolve(10); }, // generator function that will run for maxTries time
  { customer_id: 10 }, // additional info that will be logged at every failed retry attempt
  {
    maxTries: 5, // how many times to try running given function
    multiplier: 5, // what is the basic number that will be multiplied by exponent
    logStrategy: function(e, { attempts, lastDelayTime, context = {} }) {
      // custom log function, default is logentries-logformat
    }
  }
);
```

### Customization

It can come in handy to provide an application level wrapper to hide custom setup of log method and retry counts.

```javascript
let retryOnError = require('@emartech/retry-on-error');
let config = require('../config');
let logger = require('bunyan-debug')('retry');

module.exports = function*(generatorFunction, context = {}) {
  return yield retryOnError.runExponential(
    generatorFunction,
    context,
    {
      maxTries: config.retry.maxTries,
      exponentialBase: config.retry.exponentialBase,
      multiplier: config.retry.multiplier,
      logStrategy: function(e, { attempts, lastDelayTime, context = {} }) {
        logger.warn('attempt', Object.assign({
          error_name: e.name,
          error_stack: e.stack,
          error_message: e.message,
          attempt: attempts,
          delay: lastDelayTime,
        }, context))
      }
    }
  );
};

```

## Test usage

### Mocking

```javascript
let retryOnError = require('@emartech/retry-on-error');
let co = require('co');

describe('SubjectUnderTest', function() {
  beforeEach(function() {
    this.sandbox.stub(retryOnError, 'runExponential', function(generatorFn) {
      return co(generatorFn);
    });
  });
});
```

## Logging

By default all failed attempts are logged with logentries-logformat. It is possible to supply custom logger.

Default namespace is ```retry-on-error```.

----

Copyright EMARSYS 2016 All rights reserved.
