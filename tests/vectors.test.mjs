// Bitcoin Base58 reference test vectors.
// Source: en.bitcoin.it/wiki/Base58Check_encoding and standard test cases.
import { base58Encode, base58Decode } from '../dist/index.js';

let pass = 0, fail = 0;
function check(name, got, want) {
  if (got === want) { console.log(`ok ${name} → ${JSON.stringify(got)}`); pass++; }
  else { console.log(`not ok ${name}\n    got  ${JSON.stringify(got)}\n    want ${JSON.stringify(want)}`); fail++; }
}

function fromHex(s) {
  s = s.replace(/\s+/g, '');
  const out = new Uint8Array(s.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(s.substr(i * 2, 2), 16);
  return out;
}
function toHex(b) {
  let s = '';
  for (let i = 0; i < b.length; i++) s += b[i].toString(16).padStart(2, '0');
  return s;
}

// Reference test vectors (canonical, from Bitcoin wiki and others)
const encodeCases = [
  [new Uint8Array([]),                               ''],
  [new Uint8Array([0x00]),                           '1'],
  [new Uint8Array([0x00, 0x00]),                     '11'],
  [new Uint8Array([0x61]),                           '2g'],
  [new Uint8Array([0x62, 0x62, 0x62]),               'a3gV'],
  [new Uint8Array([0x63, 0x63, 0x63]),               'aPEr'],
  [new TextEncoder().encode('Hello World!'),         '2NEpo7TZRRrLZSi2U'],
  [new TextEncoder().encode('The quick brown fox jumps over the lazy dog.'),
                                                     'USm3fpXnKG5EUBx2ndxBDMPVciP5hGey2Jh4NDv6gmeo1LkMeiKrLJUUBk6Z'],
];

for (const [bytes, want] of encodeCases) {
  check(`encode(${bytes.length} bytes)`, base58Encode(bytes), want);
}

// Decode round-trips
for (const [bytes, encoded] of encodeCases) {
  if (encoded === '') continue;
  const decoded = base58Decode(encoded);
  check(`decode(${JSON.stringify(encoded.slice(0, 20) + (encoded.length > 20 ? '…' : ''))}) round-trips`,
        toHex(decoded), toHex(bytes));
}

// Bitcoin alphabet sanity: no 0, O, I, l
{
  const sample = base58Encode(new Uint8Array([0xff, 0xee, 0xdd, 0xcc, 0xbb, 0xaa, 0x99, 0x88]));
  const hasBadChar = /[0OIl]/.test(sample);
  check('encoded output uses Bitcoin alphabet (no 0/O/I/l)', !hasBadChar, true);
}

// Empty round-trip
check('decode("") returns empty Uint8Array', base58Decode('').length, 0);

// Different inputs encode differently
{
  const a = base58Encode(new Uint8Array([1, 2, 3]));
  const b = base58Encode(new Uint8Array([1, 2, 4]));
  check('different inputs produce different encodings', a !== b, true);
}

// Round-trip arbitrary 32-byte random input (simulates a private key)
{
  const random = new Uint8Array(32);
  for (let i = 0; i < 32; i++) random[i] = (i * 17 + 5) & 0xff;
  const enc = base58Encode(random);
  const dec = base58Decode(enc);
  check('roundtrip 32 bytes', toHex(dec), toHex(random));
}

console.log(`\n${pass}/${pass + fail} pass`);
process.exit(fail === 0 ? 0 : 1);
