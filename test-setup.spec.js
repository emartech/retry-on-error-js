'use strict';

var sinon = require('sinon');

var chai = require('chai');
var sinonChai = require('sinon-chai');
var chaiSubset = require('chai-subset');
var chaiAsPromised = require('chai-as-promised');
require('sinon-as-promised');

const Delay = require('@emartech/delay-js');

chai.use(chaiAsPromised);
chai.use(chaiSubset);
chai.use(sinonChai);
global.expect = chai.expect;


beforeEach(function() {
  this.sinon = sinon;
  this.sandbox = sinon.sandbox.create();
  this.disableDelay = (() => {
    this.sandbox.stub(Delay, 'wait').resolves();
  }).bind(this);
});


afterEach(function() {
  this.sandbox.restore();
});
