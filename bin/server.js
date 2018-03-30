#!/usr/bin/env node

'use strict';

const pkg = require('../package.json');
const StubServer = require('../lib/server/stub');
const util = require('../lib/util');

let host = '127.0.0.1';
let port = 53;
let inet6 = null;
let edns = null;
let dnssec = null;
let debug = false;

for (let i = 2; i < process.argv.length; i++) {
  const arg = process.argv[i];

  if (arg.length === 0)
    throw new Error(`Unexpected argument: ${arg}.`);

  switch (arg) {
    case '-4':
      inet6 = false;
      break;
    case '-6':
      inet6 = true;
      break;
    case '-p':
      port = util.parseU16(process.argv[i + 1]);
      i += 1;
      break;
    case '-h':
    case '--help':
    case '-?':
    case '-v':
      console.log(`server.js ${pkg.version}`);
      process.exit(0);
      break;
    case '+edns':
      edns = true;
      break;
    case '+noedns':
      edns = false;
      break;
    case '+dnssec':
      edns = true;
      dnssec = true;
      break;
    case '+nodnssec':
      dnssec = false;
      break;
    case '+debug':
      debug = true;
      break;
    case '+nodebug':
      debug = false;
      break;
    default:
      if (arg[0] === '@') {
        host = arg.substring(1);
        break;
      }

      throw new Error(`Unexpected argument: ${arg}.`);
  }
}

const server = new StubServer({
  inet6,
  edns,
  dnssec
});

server.conf.fromSystem();
server.hosts.fromSystem();

server.on('error', (err) => {
  console.error(err.stack);
});

if (debug) {
  server.on('log', (...args) => {
    console.error(...args);
  });

  server.on('query', (req, res, rinfo) => {
    console.error('');
    console.error('Rinfo:');
    console.error('Address: %s, Port: %d, TCP: %s',
      rinfo.address, rinfo.port, rinfo.tcp);

    console.error('');
    console.error('Request:');
    console.error(req.toString());

    console.error('Response:');
    console.error(res.toString());
  });
}

server.on('listening', () => {
  const {address, port} = server.address();
  console.log(`Server listening on ${address}:${port}.`);
});

server.open(port, host);
