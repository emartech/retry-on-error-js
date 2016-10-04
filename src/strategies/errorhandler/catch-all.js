'use strict';

class CatchAllErrorHandlerStrategy {
  static create() {
    return new CatchAllErrorHandlerStrategy();
  }

  canCatch() {
    return true;
  }
}

module.exports = CatchAllErrorHandlerStrategy;
