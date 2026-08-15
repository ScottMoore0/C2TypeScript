// Base64 RFC 4648 §10 reference test vectors.
import { encode, decode, decodeToString } from '../dist/index.js';

let pass = 0, fail = 0;
function check(name, got, want) {
  if (got === want) { console.log(`ok ${name}`); pass++; }
  else { console.log(`not ok ${name}\n    got  ${JSON.stringify(got)}\n    want ${JSON.stringify(want)}`); fail++; }
}

// RFC 4648 §10
check('encode ""',       encode(''),       '');
check('encode "f"',      encode('f'),      'Zg==');
check('encode "fo"',     encode('fo'),     'Zm8=');
check('encode "foo"',    encode('foo'),    'Zm9v');
check('encode "foob"',   encode('foob'),   'Zm9vYg==');
check('encode "fooba"',  encode('fooba'),  'Zm9vYmE=');
check('encode "foobar"', encode('foobar'), 'Zm9vYmFy');

// Decode round-trip — this is the path that exercises out[j++] |= c.
// If the compound-assign-postinc bug is present, the decoder writes the
// low nibble to the WRONG byte and silently corrupts output.
check('decode "Zg=="',       decodeToString('Zg=='),       'f');
check('decode "Zm8="',       decodeToString('Zm8='),       'fo');
check('decode "Zm9v"',       decodeToString('Zm9v'),       'foo');
check('decode "Zm9vYg=="',   decodeToString('Zm9vYg=='),   'foob');
check('decode "Zm9vYmE="',   decodeToString('Zm9vYmE='),   'fooba');
check('decode "Zm9vYmFy"',   decodeToString('Zm9vYmFy'),   'foobar');

// Longer payload — exercises many bytes of partial-byte accumulation.
{
  const pangram = 'The quick brown fox jumps over the lazy dog.';
  const enc = encode(pangram);
  check('encode pangram',     enc, 'VGhlIHF1aWNrIGJyb3duIGZveCBqdW1wcyBvdmVyIHRoZSBsYXp5IGRvZy4=');
  check('round-trip pangram', decodeToString(enc), pangram);
}

// Binary round-trip
{
  const data = new Uint8Array(256);
  for (let i = 0; i < 256; i++) data[i] = i;
  const enc = encode(data);
  const dec = decode(enc);
  const ok = dec && dec.length === 256 && dec.every((b, i) => b === i);
  check('binary 0..255 round-trip', ok, true);
}

// Reject malformed length
check('decode length not multiple of 4', decode('abc'), null);
// Reject illegal characters
check('decode illegal char "!"',          decode('a!a='), null);

console.log(`\n${pass}/${pass + fail} pass`);
process.exit(fail === 0 ? 0 : 1);
