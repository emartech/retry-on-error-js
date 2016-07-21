'use strict';

module.exports = require('./src/retry-on-error');
module.exports.fibonacciStrategy = require('./src/fibonacci-delay');
module.exports.noDelayStrategy = require('./src/no-delay');
