/* eslint-env mocha */
/* eslint prefer-arrow-callback: "off" */

'use strict';

const assert = require('./util/assert');
const Path = require('path');
const wire = require('../lib/wire');
const Zone = require('../lib/zone');
const {types} = wire;

const ROOT_ZONE = Path.resolve(__dirname, 'data', 'root.zone');

const comResponse = `
com. 172800 IN NS a.gtld-servers.net.
com. 172800 IN NS b.gtld-servers.net.
com. 172800 IN NS c.gtld-servers.net.
com. 172800 IN NS d.gtld-servers.net.
com. 172800 IN NS e.gtld-servers.net.
com. 172800 IN NS f.gtld-servers.net.
com. 172800 IN NS g.gtld-servers.net.
com. 172800 IN NS h.gtld-servers.net.
com. 172800 IN NS i.gtld-servers.net.
com. 172800 IN NS j.gtld-servers.net.
com. 172800 IN NS k.gtld-servers.net.
com. 172800 IN NS l.gtld-servers.net.
com. 172800 IN NS m.gtld-servers.net.
`;

const nxResponse = `
. 86400 IN SOA a.root-servers.net. nstld.verisign-grs.com. (
  2018080200 1800 900 604800 86400
)

. 86400 IN RRSIG SOA 8 0 86400 20180815050000 20180802040000 41656 . (
  X/yeZjlX2H6BugnNCekXYRXSNkzq8zW7XKfRyBq0F9Z0aZ+BGcUNSRWG
  rrHXDWfcTSDTBlWq0Vq7Bec5ZOvDwRm1anCWhG0wejliC3rxhCK4O+Eg
  LelKscLA99K3jaKL3CKRRVitk08IRGxHCX725kk+GAR3/gWQnhXmO3DM
  vmC5DVWCMCa3Jywnij4CsoaNqMczm/KKztk/i/lRlw0h+nVND73fgRMc
  0NDXkv/oJJo9zzk877nfvS1B0fNwmgwRjA6Luj753u5VDYbpxDjUxXXn
  eklu1LBO0SMvCk2opUvB5ADJ5JCYRvmB4Rll42vaB6gUbuJOoOTnY/tU
  KgV9gg==
)

id. 86400 IN NSEC ie. NS DS RRSIG NSEC

id. 86400 IN RRSIG NSEC 8 1 86400 20180815050000 20180802040000 41656 . (
  TkoEX0Eb9ObbVUvZ7CzCTIOSg6dF/IQMWwUFOyXxL2jwZiEGOpMw6YDY
  yGl1rl5SD3zXd3/Gs0XICu4DA7E3PALCWttwRC5K47qBqx5RgfL53rT9
  r0wINeuf0hhtYGJKvOxXOxqnzrop48xWbpFBu/ftA1CeRsNxqqyWbGzQ
  QFoArL+kdbFbivyUDFWHXBdwZ8t7iN1APhHf9R0ZNR2CRMqeTw4C/Bls
  aF26wviT+6TkkQBcLYPlUnZWj+R1eJjA5hlUvvjY53x9EYapIpr+qf49
  QyUq/H3QtdNrrU+pNcbxuJby0jB+txvrAQfWXJ0hXYqHUnMqfQIny/gN
  ihwlkA==
)

. 86400 IN NSEC aaa. NS SOA RRSIG NSEC DNSKEY

. 86400 IN RRSIG NSEC 8 0 86400 20180815050000 20180802040000 41656 . (
  gyyjLKjueKD4ho7bMZJ5Vvlxf7y0sDz9uzHCV4w06zNtCzMNkrkjKYR+
  z0UsoNBHaSSKU1HfIVZCr7VDnrT9V68CAG1Ry4qXJZiNudmXNVkNhMJw
  fBEIhiTiQpW8XxdRuaQz1aPSmI4uViiJ2mxjoBysSqJY3wrjK5sa/7dL
  T+LEdEBchPDQPQqLFCAfkjgaCXIn8iqtegqSbrjhMXkSq3E43Gw5YHnE
  rw+dgI4osARUMP1MdsWUH9CAsa0hXsXA/MJUgr2RYmdLdghZHPZPiCwf
  cGS7GqyJ2LHm+5twVDcsVnQzRDwoaoFG6i49bq75/qAWB1gmKs0kzd6I
  0kyi7A==
)
`;

describe('Zone', function() {
  it('should serve root zone', () => {
    const zone = Zone.fromFile('.', ROOT_ZONE);

    assert.strictEqual(zone.names.size, 5717);

    const msg = zone.resolve('com.', types.NS);
    const expect = wire.fromZone(comResponse);

    assert.deepStrictEqual(msg.answer, expect);

    const msg2 = zone.resolve('idontexist.', types.A);
    assert(msg2.answer.length === 0);
    const expect2 = wire.fromZone(nxResponse);

    assert.deepStrictEqual(msg2.authority, expect2);
  });
});
