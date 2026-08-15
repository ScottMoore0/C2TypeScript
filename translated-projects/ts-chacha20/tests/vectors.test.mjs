// ChaCha20 reference test vectors from RFC 8439 ("ChaCha20 and Poly1305
// for IETF Protocols").
import { ChaCha20, chacha20 } from '../dist/index.js';

let pass = 0, fail = 0;
function check(name, got, want) {
  if (got === want) { console.log(`ok ${name}`); pass++; }
  else { console.log(`not ok ${name}\n    got  ${got}\n    want ${want}`); fail++; }
}

function fromHex(s) {
  s = s.replace(/[^0-9a-fA-F]/g, '');
  const out = new Uint8Array(s.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(s.substr(i * 2, 2), 16);
  return out;
}
function toHex(b) {
  let s = '';
  for (let i = 0; i < b.length; i++) s += b[i].toString(16).padStart(2, '0');
  return s;
}

// RFC 8439 §2.4.2 — Encryption Example
{
  const key   = fromHex('00 01 02 03 04 05 06 07 08 09 0a 0b 0c 0d 0e 0f' +
                        '10 11 12 13 14 15 16 17 18 19 1a 1b 1c 1d 1e 1f');
  const nonce = fromHex('00 00 00 00 00 00 00 4a 00 00 00 00');
  const plaintext = new TextEncoder().encode(
    "Ladies and Gentlemen of the class of '99: " +
    "If I could offer you only one tip for the future, sunscreen would be it."
  );
  const expectedHex =
    '6e 2e 35 9a 25 68 f9 80 41 ba 07 28 dd 0d 69 81' +
    'e9 7e 7a ec 1d 43 60 c2 0a 27 af cc fd 9f ae 0b' +
    'f9 1b 65 c5 52 47 33 ab 8f 59 3d ab cd 62 b3 57' +
    '16 39 d6 24 e6 51 52 ab 8f 53 0c 35 9f 08 61 d8' +
    '07 ca 0d bf 50 0d 6a 61 56 a3 8e 08 8a 22 b6 5e' +
    '52 bc 51 4d 16 cc f8 06 81 8c e9 1a b7 79 37 36' +
    '5a f9 0b bf 74 a3 5b e6 b4 0b 8e ed f2 78 5e 42' +
    '87 4d';

  const ct = chacha20(key, nonce, plaintext, 1);
  check('RFC 8439 §2.4.2 encryption example', toHex(ct), toHex(fromHex(expectedHex)));

  // Decrypt by XOR-ing again with the same keystream
  const recovered = chacha20(key, nonce, ct, 1);
  check('RFC 8439 §2.4.2 decryption is identity', toHex(recovered), toHex(plaintext));
}

// RFC 8439 §A.2 — additional encryption test vectors

// Test vector A.2 #1 — all-zero key, all-zero nonce, counter 0
{
  const key   = new Uint8Array(32);
  const nonce = new Uint8Array(12);
  const pt    = new Uint8Array(64);
  const expectedHex =
    '76b8e0ada0f13d90405d6ae55386bd28' +
    'bdd219b8a08ded1aa836efcc8b770dc7' +
    'da41597c5157488d7724e03fb8d84a37' +
    '6a43b8f41518a11cc387b669b2ee6586';
  const ct = chacha20(key, nonce, pt, 0);
  check('RFC 8439 §A.2 vector 1 (all-zero key/nonce, counter 0)', toHex(ct), expectedHex);
}

// Test vector A.2 #2 — key=0..0|1 LSB, nonce=0..2 LSB, counter=1
{
  const key   = fromHex('00000000000000000000000000000000' +
                        '00000000000000000000000000000001');
  const nonce = fromHex('000000000000000000000002');
  const pt    = new TextEncoder().encode(
    "Any submission to the IETF intended by the Contributor for publication as all or part of an IETF Internet-Draft or RFC and any statement made within the context of an IETF activity is considered an \"IETF Contribution\". Such statements include oral statements in IETF sessions, as well as written and electronic communications made at any time or place, which are addressed to"
  );
  const expectedHex =
    'a3fbf07df3fa2fde4f376ca23e827370' +
    '41605d9f4f4f57bd8cff2c1d4b7955ec' +
    '2a97948bd3722915c8f3d337f7d37005' +
    '0e9e96d647b7c39f56e031ca5eb6250d' +
    '4042e02785ececfa4b4bb5e8ead0440e' +
    '20b6e8db09d881a7c6132f420e527950' +
    '42bdfa7773d8a9051447b3291ce1411c' +
    '680465552aa6c405b7764d5e87bea85a' +
    'd00f8449ed8f72d0d662ab052691ca66' +
    '424bc86d2df80ea41f43abf937d3259d' +
    'c4b2d0dfb48a6c9139ddd7f76966e928' +
    'e635553ba76c5c879d7b35d49eb2e62b' +
    '0871cdac638939e25e8a1e0ef9d5280f' +
    'a8ca328b351c3c765989cbcf3daa8b6c' +
    'cc3aaf9f3979c92b3720fc88dc95ed84' +
    'a1be059c6499b9fda236e7e818b04b0b' +
    'c39c1e876b193bfe5569753f88128cc0' +
    '8aaa9b63d1a16f80ef2554d7189c411f' +
    '5869ca52c5b83fa36ff216b9c1d30062' +
    'bebcfd2dc5bce0911934fda79a86f6e6' +
    '98ced759c3ff9b6477338f3da4f9cd85' +
    '14ea9982ccafb341b2384dd902f3d1ab' +
    '7ac61dd29c6f21ba5b862f3730e37cfd' +
    'c4fd806c22f221';
  const ct = chacha20(key, nonce, pt, 1);
  check('RFC 8439 §A.2 vector 2 (long IETF text)', toHex(ct), expectedHex);
}

// Streaming class: process() in chunks must equal one-shot
{
  const key   = fromHex('00 01 02 03 04 05 06 07 08 09 0a 0b 0c 0d 0e 0f' +
                        '10 11 12 13 14 15 16 17 18 19 1a 1b 1c 1d 1e 1f');
  const nonce = fromHex('00 00 00 00 00 00 00 4a 00 00 00 00');
  const pt    = new TextEncoder().encode('streaming test of the chacha20 cipher across multiple update calls');
  const ref = chacha20(key, nonce, pt, 1);

  const c = new ChaCha20(key, nonce, 1);
  const out = new Uint8Array(pt.length);
  let o = 0;
  for (const chunkSize of [7, 13, 1, 64, pt.length]) {
    const remain = pt.length - o;
    if (remain <= 0) break;
    const slice = pt.subarray(o, o + Math.min(chunkSize, remain));
    const enc = c.process(slice);
    out.set(enc, o);
    o += enc.length;
  }
  check('chunked process() equals one-shot', toHex(out), toHex(ref));
}

// Length validation
{
  let threw = false;
  try { new ChaCha20(new Uint8Array(31), new Uint8Array(12)); } catch { threw = true; }
  check('rejects short key', threw, true);
}
{
  let threw = false;
  try { new ChaCha20(new Uint8Array(32), new Uint8Array(8)); } catch { threw = true; }
  check('rejects short nonce', threw, true);
}

console.log(`\n${pass}/${pass + fail} pass`);
process.exit(fail === 0 ? 0 : 1);
