// NIST FIPS 180-4 SHA-256 known-answer tests.
// Plus a streaming test that splits a payload across multiple .update() calls
// and asserts identical output to the one-shot path.
const M = await import('../dist/index.js');

interface Case { label: string; msg: string; want: string; }

// One-shot test vectors (NIST FIPS 180-4 Appendix B + commonly-published checks)
const cases: Case[] = [
  {
    label: 'empty string',
    msg: '',
    want: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  },
  {
    label: 'abc (FIPS 180-4 §B.1)',
    msg: 'abc',
    want: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  },
  {
    label: '56-byte multi-block (FIPS 180-4 §B.2)',
    msg: 'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq',
    want: '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
  },
  {
    label: 'quick brown fox',
    msg: 'The quick brown fox jumps over the lazy dog',
    want: 'd7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592',
  },
  {
    label: 'quick brown fox + period',
    msg: 'The quick brown fox jumps over the lazy dog.',
    want: 'ef537f25c895bfa782526529a9b63d97aa631564d5d789c2b765448c8635fb6c',
  },
];

let pass = 0, fail = 0;
function ok(s: string) { console.log(`ok - ${s}`); pass++; }
function bad(s: string) { console.log(`not ok - ${s}`); fail++; }

// One-shot: sha256Hex
for (const c of cases) {
  const got = M.sha256Hex(c.msg);
  if (got === c.want) ok(`one-shot sha256Hex: ${c.label}`);
  else                bad(`one-shot sha256Hex: ${c.label}\n    got  ${got}\n    want ${c.want}`);
}

// One-shot: sha256 returns Uint8Array
{
  const bytes = M.sha256('abc');
  const hex = Array.from(bytes, (b: number) => b.toString(16).padStart(2, '0')).join('');
  const want = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
  if (hex === want && bytes.length === 32) ok('one-shot sha256 returns 32-byte Uint8Array');
  else                                     bad(`one-shot sha256 bytes mismatch: ${hex}`);
}

// Streaming: feed bytes one-at-a-time and verify against the same vector
{
  const msg = 'The quick brown fox jumps over the lazy dog';
  const want = 'd7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592';
  const h = new M.Sha256();
  for (const ch of new TextEncoder().encode(msg)) {
    h.update(new Uint8Array([ch]));
  }
  const got = h.digestHex();
  if (got === want) ok('streaming Sha256: byte-by-byte matches one-shot');
  else              bad(`streaming Sha256:\n    got  ${got}\n    want ${want}`);
}

// Streaming: digest twice throws
{
  const h = new M.Sha256();
  h.update('abc');
  h.digest();
  try {
    h.digest();
    bad('streaming Sha256: digest twice should have thrown');
  } catch {
    ok('streaming Sha256: digest twice throws');
  }
}

// Streaming: update after digest throws
{
  const h = new M.Sha256();
  h.update('abc');
  h.digest();
  try {
    h.update('def');
    bad('streaming Sha256: update after digest should have thrown');
  } catch {
    ok('streaming Sha256: update after digest throws');
  }
}

// Constant export
{
  if (M.SHA256_DIGEST_SIZE === 32) ok('SHA256_DIGEST_SIZE === 32');
  else                              bad(`SHA256_DIGEST_SIZE === ${M.SHA256_DIGEST_SIZE}`);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
