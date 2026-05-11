// SipHash-2-4 reference test vectors from the upstream veorq/SipHash
// repository (vectors.h). 64 vectors, each 8 bytes:
//   key   = 0x00, 0x01, ..., 0x0f
//   input = 0x00, 0x01, ..., (i-1) for i = 0..63
// Expected output = vectors_sip64[i] (8 bytes per row).
import { readFileSync } from 'node:fs';
const M = await import('../dist/index.js');

const raw = readFileSync(new URL('./vectors.txt', import.meta.url), 'utf8');
const bytes = raw.trim().split(',').map((s) => parseInt(s.trim(), 16));
if (bytes.length !== 64 * 8) {
  console.error(`Expected 512 vector bytes, got ${bytes.length}`);
  process.exit(2);
}

const key = new Uint8Array(16);
for (let i = 0; i < 16; i++) key[i] = i;

let pass = 0, fail = 0;
for (let len = 0; len < 64; len++) {
  const input = new Uint8Array(len);
  for (let i = 0; i < len; i++) input[i] = i;
  const out = new Uint8Array(8);
  M.siphash(
    { buf: input, off: 0 },
    len,
    { buf: key, off: 0 },
    { buf: out, off: 0 },
    8
  );
  let ok = true;
  for (let i = 0; i < 8; i++) {
    if (out[i] !== bytes[len * 8 + i]) { ok = false; break; }
  }
  if (ok) pass++;
  else {
    const gotHex = Array.from(out, (b: number) => b.toString(16).padStart(2, '0')).join('');
    const wantHex = bytes.slice(len * 8, len * 8 + 8).map((b: number) => b.toString(16).padStart(2, '0')).join('');
    fail++;
    if (fail <= 5) console.log(`not ok - len=${len}: got ${gotHex} want ${wantHex}`);
  }
}
console.log(`ok - ${pass}/${pass + fail} SipHash-2-4 reference vectors pass`);
process.exit(fail === 0 ? 0 : 1);
