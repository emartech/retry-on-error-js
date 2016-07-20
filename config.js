'use strict';

const config = {
  maxTries: process.env.RETRY_ON_ERROR_MAX_TRIES || 10
};

module.exports = config;
