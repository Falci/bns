#!/usr/bin/env node

'use strict';

const {RecursiveResolver} = require('../lib/resolver');
const reverse = process.argv.indexOf('-x');

if (reverse !== -1)
  process.argv.splice(reverse, 1);

async function resolve(name, type, host, port) {
  const resolver = new RecursiveResolver('udp4');

  resolver.on('log', (...args) => {
    console.error(...args);
  });

  await resolver.open();

  if (reverse !== -1) {
    try {
      return await resolver.reverse(name);
    } finally {
      await resolver.close();
    }
  }

  try {
    return await resolver.lookup(name, type);
  } finally {
    await resolver.close();
  }
}

(async () => {
  const name = process.argv[2] || null;
  const type = process.argv[3] || null;
  const host = process.argv[4] || null;
  const port = (process.argv[5] | 0) || null;
  const now = Date.now();
  const res = await resolve(name, type, host, port);
  const ms = Date.now() - now;

  console.log(res.toString(ms));
})().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
