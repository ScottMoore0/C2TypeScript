// MurmurHash3 reference test vectors.
// x86_32 vectors are from Austin Appleby's SMHasher reference tests
// (KeysetTest / VerificationTest). All MurmurHash3 implementations should
// agree on these values; the upstream C version is the spec.
import { murmur3_x86_32, murmur3_x86_128, murmur3_x64_128, toHex } from '../dist/index.js';

let pass = 0, fail = 0;

function check(name, got, want) {
  if (got === want) { console.log(`ok ${name} → ${got}`); pass++; }
  else { console.log(`not ok ${name}\n    got  ${got}\n    want ${want}`); fail++; }
}

// MurmurHash3_x86_32 — well-known reference vectors.
check('x86_32("", seed=0)',         '0x' + murmur3_x86_32('').toString(16).padStart(8, '0'),               '0x00000000');
check('x86_32("", seed=1)',         '0x' + murmur3_x86_32('', 1).toString(16).padStart(8, '0'),            '0x514e28b7');
check('x86_32("", seed=0xffffffff)','0x' + murmur3_x86_32('', 0xffffffff).toString(16).padStart(8, '0'),   '0x81f16f39');
check('x86_32("\\0\\0\\0\\0")',     '0x' + murmur3_x86_32(new Uint8Array(4)).toString(16).padStart(8, '0'),'0x2362f9de');
check('x86_32("aaaa", 0x9747b28c)', '0x' + murmur3_x86_32('aaaa', 0x9747b28c).toString(16).padStart(8, '0'),'0x5a97808a');
check('x86_32("abcd", 0x9747b28c)', '0x' + murmur3_x86_32('abcd', 0x9747b28c).toString(16).padStart(8, '0'),'0xf0478627');
check('x86_32("Hello, world!", 0x9747b28c)',
      '0x' + murmur3_x86_32('Hello, world!', 0x9747b28c).toString(16).padStart(8, '0'),
      '0x24884cba');

// MurmurHash3_x64_128 — empty input + "test" with seed 0 are standard reference vectors.
check('x64_128("", seed=0)',     toHex(murmur3_x64_128('')),       '00000000000000000000000000000000');
check('x64_128("test", seed=0)', toHex(murmur3_x64_128('test')),   '9de1bd74cc287dac824dbdf93182129a');

// MurmurHash3_x86_128 — empty input is the simplest deterministic check.
check('x86_128("", seed=0)',     toHex(murmur3_x86_128('')),       '00000000000000000000000000000000');

console.log(`\n${pass}/${pass + fail} pass`);
process.exit(fail === 0 ? 0 : 1);
