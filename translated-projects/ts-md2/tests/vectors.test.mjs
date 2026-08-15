// MD2 reference test vectors from RFC 1319 §A.5.
import { md2, md2Hex, Md2 } from '../dist/index.js';

let pass = 0, fail = 0;
function check(name, got, want) {
  if (got === want) { console.log(`ok ${name} → ${got}`); pass++; }
  else { console.log(`not ok ${name}\n    got  ${got}\n    want ${want}`); fail++; }
}

// RFC 1319 §A.5 vectors
check('MD2("")',        md2Hex(''),
  '8350e5a3e24c153df2275c9f80692773');
check('MD2("a")',       md2Hex('a'),
  '32ec01ec4a6dac72c0ab96fb34c0b5d1');
check('MD2("abc")',     md2Hex('abc'),
  'da853b0d3f88d99b30283a69e6ded6bb');
check('MD2("message digest")', md2Hex('message digest'),
  'ab4f496bfb2a530b219ff33031fe06b0');
check('MD2(lowercase alphabet)', md2Hex('abcdefghijklmnopqrstuvwxyz'),
  '4e8ddff3650292ab5a4108c3aa47940b');
check('MD2(alphanumeric)',
  md2Hex('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'),
  'da33def2a42df13975352846c30338cd');
check('MD2(80 digits)',
  md2Hex('12345678901234567890123456789012345678901234567890123456789012345678901234567890'),
  'd5976f79d83d3a0dc9806c3c66f3efd8');

// Streaming API
{
  const h = new Md2();
  h.update('mess'); h.update('age '); h.update('digest');
  check('streaming MD2("message digest")', h.hexDigest(),
    'ab4f496bfb2a530b219ff33031fe06b0');
}

// Byte-by-byte stream
{
  const h = new Md2();
  for (const c of 'abc') h.update(c);
  check('streaming MD2("abc") byte-by-byte', h.hexDigest(),
    'da853b0d3f88d99b30283a69e6ded6bb');
}

// Returns Uint8Array of length 16
{
  const out = md2('abc');
  check('md2() returns 16-byte Uint8Array', out instanceof Uint8Array && out.length === 16, true);
}

// Uint8Array input
check('md2(bytes("abc"))',
  md2Hex(new TextEncoder().encode('abc')),
  'da853b0d3f88d99b30283a69e6ded6bb');

console.log(`\n${pass}/${pass + fail} pass`);
process.exit(fail === 0 ? 0 : 1);
