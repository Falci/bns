/*!
 * dns.js - replacement dns node.js module
 * Copyright (c) 2018, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bns
 */

'use strict';

const API = require('./api');
const {StubResolver} = require('./resolver');

function createResolver(options, conf, hosts) {
  const resolver = new StubResolver(options);
  resolver.conf = conf;
  resolver.hosts = hosts;
  return resolver;
}

module.exports = new API(createResolver, {
  edns: false,
  dnssec: false
});