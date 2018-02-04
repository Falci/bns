/*!
 * util.js - utils for bns
 * Copyright (c) 2018, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bns
 *
 * Parts of this software are based on miekg/dns and golang/go:
 *   https://github.com/miekg/dns/blob/master/dnssec.go
 */

'use strict';

const {sizeName} = require('./encoding');
const util = exports;

util.splitName = function splitName(s) {
  if (s.length === 0)
    return [];

  const idx = util.split(s);
  const labels = [];

  let fend = 0;
  let begin = 0;

  if (s[s.length - 1] === '.')
    fend = s.length - 1;
  else
    fend = s.length;

  switch (idx.length) {
    case 0: {
      return [];
    }
    case 1: {
      break;
    }
    default: {
      let end = 0;
      for (let i = 1; i < idx.length; i++) {
        end = idx[i];
        labels.push(s.substring(begin, end - 1));
        begin = end;
      }
      break;
    }
  }

  labels.push(s.substring(begin, fend));

  return labels;
};

util.compareName = function compareName(s1, s2) {
  let n = 0;

  if (s1 === '.' || s2 === '.')
    return 0;

  const l1 = util.split(s1);
  const l2 = util.split(s2);

  let j1 = l1.length - 1;
  let i1 = l1.length - 2;

  let j2 = l2.length - 1;
  let i2 = l2.length - 2;

  const a = s1.substring(l1[j1]);
  const b = s2.substring(l2[j2]);

  if (a !== b)
    return n;

  n += 1;

  for (;;) {
    if (i1 < 0 || i2 < 0)
      break;

    const a = s1.substring(l1[i1], l1[j1]);
    const b = s2.substring(l2[i2], l2[j2]);

    if (a !== b)
      break;

    n += 1;

    j1 -= 1;
    i1 -= 1;

    j2 -= 1;
    i2 -= 1;
  }

  return n;
};

util.countLabels = function countLabels(s) {
  let labels = 0;

  if (s === '.')
    return labels;

  let off = 0;
  let end = false;

  for (;;) {
    [off, end] = util.nextLabel(s, off);

    labels += 1;

    if (end)
      break;
  }

  return labels;
};

util.split = function split(s) {
  if (s === '.')
    return [];

  const idx = [0];

  let off = 0;
  let end = false;

  for (;;) {
    [off, end] = util.nextLabel(s, off);

    if (end)
      break;

    idx.push(off);
  }

  return idx;
};

util.nextLabel = function nextLabel(s, off) {
  let quote = false;
  let i = 0;

  for (i = off; i < s.length - 1; i++) {
    switch (s[i]) {
      case '\\':
        quote = !quote;
        break;
      case '.':
        if (quote) {
          quote = !quote;
          continue;
        }
        return [i + 1, false];
      default:
        quote = false;
        break;
    }
  }

  return [i + 1, true];
};

util.prevLabel = function prevLabel(s, n) {
  if (n === 0)
    return [s.length, false];

  const lab = util.split(s);

  if (lab.length === 0) // NIL
    return [0, true];

  if (n > lab.length)
    return [0, true];

  return [lab[lab.length - n], false];
};

util.equal = function equal(a, b) {
  if (a.length !== b.length)
    return false;

  for (let i = a.length - 1; i >= 0; i--) {
    const ai = a.charCodeAt(i);
    const bi = a.charCodeAt(i);

    if (ai >= 0x41 && ai <= 0x5a)
      ai |= 0x61 - 0x41;

    if (bi >= 0x41 && bi <= 0x5a)
      bi |= 0x61 - 0x41;

    if (ai !== bi)
      return false;
  }

  return true;
};

util.isName = function isName(s) {
  try {
    sizeName(util.fqdn(s), null, false);
    return true;
  } catch (e) {
    return false;
  }
};

util.isFQDN = function isFQDN(s) {
  if (s.length === 0)
    return false;

  return s[s.length - 1] === '.';
};

util.fqdn = function fqdn(s) {
  if (!util.isFQDN(s))
    return s;

  return s.slice(0, -1);
};

util.isSubdomain = function isSubdomain(parent, child) {
  return util.compareName(parent, child) === util.countLabels(parent);
};

util.addOrigin = function addOrigin(s, origin) {
  if (util.isFQDN(s))
    return s;

  if (origin.length === 0)
    return false;

  if (s === '@' || s.length === 0)
    return origin;

  if (origin === '.')
    return dns.fqdn(s);

  return `${s}.${origin}`;
};

util.trimFQDN = function trimFQDN(s) {
  if (s.length === 0)
    return s;

  if (s[s.length - 1] === '.')
    s = s.slice(0, -1);

  return s;
};

util.trimDomainName = function trimDomainName(s, origin) {
  if (s.length === 0)
    return '@';

  if (origin === '.')
    return util.trimRoot(s);

  const original = s;

  s = util.fqdn(s);
  origin = util.fqdn(origin);

  if (!util.isSubdomain(origin, s))
    return original;

  const slabels = util.split(s);
  const olabels = util.split(origin);
  const m = util.compareName(s, origin);

  if (olabels.length === m) {
    if (olabels.length === slabels.length)
      return '@';

    if (s[0] === '.' && slabels.length === olabels.length + 1)
      return '@';
  }

  return s.substring(0, slabels[slabels.length - m] - 1);
};

util.label = function label(s, labels, index) {
  if (index < 0)
    index += labels.length;

  if (index >= labels.length)
    return '';

  const start = labels[index];

  if (index + 1 === labels.length) {
    if (util.isFQDN(s))
      return s.slice(start, -1);
    return s.substring(start);
  }

  const end = labels[index + 1];

  return s.substring(start, end - 1);
};

util.startsWith = function startsWith(s, pre) {
  if (s.startsWith)
    return s.startsWith(pre);

  if (pre.length === 0)
    return true;

  if (s.length === 0)
    return false;

  if (pre.length > s.length)
    return false;

  if (pre.length === 1)
    return s[0] === pre;

  return s.slice(0, pre.length) === pre;
};

util.endsWith = function endsWith(s, suf) {
  if (s.endsWith)
    return s.endsWith(suf);

  if (suf.length === 0)
    return true;

  if (s.length === 0)
    return false;

  if (suf.length > s.length)
    return false;

  if (suf.length === 1)
    return s[s.length - 1] === suf;

  return s.slice(-suf.length) === suf;
};

util.trimPrefix = function trimPrefix(s, pre) {
  if (util.startsWith(s, pre))
    return s.slice(pre.length);
  return s;
};

util.trimSuffix = function trimSuffix(s, suf) {
  if (util.endsWith(s, suf))
    return s.slice(0, -suf.length);
  return s;
};

util.isRRSet = function isRRSet(rrset) {
  if (rrset.length === 0)
    return false;

  if (rrset.length === 1)
    return true;

  const type = rrset[0].type;
  const class_ = rrset[0].class;
  const name = rrset[0].name;

  for (let i = 1; i < rrset.length; i++) {
    const rr = rrset[i];

    if (rr.type !== type
        || rr.class !== class_
        || rr.name !== name) {
      return false;
    }
  }

  return true;
};

util.filterSet = function filterSet(records, ...types) {
  const map = new Set(types);
  const out = [];

  for (const rr of records) {
    if (!map.has(rr.type))
      out.push(rr);
  }

  return out;
};

util.extractSet = function extractSet(records, name, ...types) {
  const map = new Set(types);
  const out = [];

  for (const rr of records) {
    if (map.has(rr.type)) {
      if (name !== '' && name !== rr.name)
        continue;
      out.push(rr);
    }
  }

  return out;
};

util.hasAll = function hasAll(records, type) {
  for (const rr of records) {
    if (rr.type !== type)
      return false;
  }
  return true;
};

util.random = function random(n) {
  return Math.floor(Math.random() * n);
};

util.randomItem = function randomItem(items) {
  return items[util.random(items.length)];
};

util.now = function now() {
  return Math.floor(Date.now() / 1000);
};

util.dir = function dir(obj) {
  console.dir(obj, {
    depth: 20,
    colors: true,
    customInspect: true
  });
};
