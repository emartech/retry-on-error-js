'use strict';

module.exports = require('./src/retry-on-error');
module.exports.strategies = {
  delay: {
    fibonacci: require('./src/strategies/delay/fibonacci-delay'),
    noDelay: require('./src/strategies/delay/no-delay')
  },
  errorHandler: {
    catchAll: require('./src/strategies/errorhandler/catch-all')
  }
};
