/**
 * Reference-vector tests for ts-tiny-aes.
 *
 * Sources:
 *   - NIST FIPS 197 "Advanced Encryption Standard", Appendix B and C.
 *   - NIST SP 800-38A "Recommendation for Block Cipher Modes of Operation",
 *     Appendix F (CBC, CTR test vectors).
 *
 * Notes:
 *   tiny-AES-c (the upstream) is a single-build library where the key size
 *   is fixed at compile time. The shipped translated build is AES-128 only
 *   (KeyExpansion uses Nk=4, Nr=10), so AES-192/256 are documented but not
 *   exercised here -- those would require a different build of tiny-AES-c.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AES_ctx,
  AES_init_ctx,
  AES_init_ctx_iv,
  AES_ECB_encrypt,
  AES_ECB_decrypt,
  AES_CBC_encrypt_buffer,
  AES_CBC_decrypt_buffer,
  AES_CTR_xcrypt_buffer,
} from '../dist/index.js';

const hex = (h: string): Uint8Array => {
  const s = h.replace(/\s+/g, '');
  const out = new Uint8Array(s.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(s.substr(i * 2, 2), 16);
  return out;
};
const toHex = (b: Uint8Array): string =>
  Array.from(b).map((x) => x.toString(16).padStart(2, '0')).join('');
const ptr = (data: Uint8Array) => ({ buf: data, off: 0 });

test('FIPS 197 sanity: AES-128 zero-key encrypts zero block to NIST canonical value', () => {
  const key = new Uint8Array(16);
  const block = new Uint8Array(16);
  const ctx = new AES_ctx();
  AES_init_ctx(ctx, ptr(key));
  AES_ECB_encrypt(ctx, ptr(block));
  // FIPS 197 Appendix B-style sanity check, widely cited reference output.
  assert.equal(toHex(block), '66e94bd4ef8a2c3b884cfa59ca342b2e');
});

test('FIPS 197 Appendix C.1: AES-128 ECB encrypt matches reference ciphertext', () => {
  const key = hex('000102030405060708090a0b0c0d0e0f');
  const plaintext = hex('00112233445566778899aabbccddeeff');
  const expected = '69c4e0d86a7b0430d8cdb78070b4c55a';
  const block = new Uint8Array(plaintext);
  const ctx = new AES_ctx();
  AES_init_ctx(ctx, ptr(key));
  AES_ECB_encrypt(ctx, ptr(block));
  assert.equal(toHex(block), expected);
});

test('FIPS 197 Appendix C.1: AES-128 ECB decrypt round-trip restores plaintext', () => {
  const key = hex('000102030405060708090a0b0c0d0e0f');
  const plaintext = hex('00112233445566778899aabbccddeeff');
  const block = new Uint8Array(plaintext);
  const ctx = new AES_ctx();
  AES_init_ctx(ctx, ptr(key));
  AES_ECB_encrypt(ctx, ptr(block));
  AES_ECB_decrypt(ctx, ptr(block));
  assert.deepEqual(Array.from(block), Array.from(plaintext));
});

test('NIST SP 800-38A F.1.1: AES-128 ECB block 1 of 4 (key=2b7e1516..., pt=6bc1bee2...)', () => {
  const key = hex('2b7e151628aed2a6abf7158809cf4f3c');
  const plaintext = hex('6bc1bee22e409f96e93d7e117393172a');
  const expected = '3ad77bb40d7a3660a89ecaf32466ef97';
  const block = new Uint8Array(plaintext);
  const ctx = new AES_ctx();
  AES_init_ctx(ctx, ptr(key));
  AES_ECB_encrypt(ctx, ptr(block));
  assert.equal(toHex(block), expected);
  AES_ECB_decrypt(ctx, ptr(block));
  assert.deepEqual(Array.from(block), Array.from(plaintext));
});

test('NIST SP 800-38A F.1.1: AES-128 ECB block 2 of 4', () => {
  const key = hex('2b7e151628aed2a6abf7158809cf4f3c');
  const plaintext = hex('ae2d8a571e03ac9c9eb76fac45af8e51');
  const expected = 'f5d3d58503b9699de785895a96fdbaaf';
  const block = new Uint8Array(plaintext);
  const ctx = new AES_ctx();
  AES_init_ctx(ctx, ptr(key));
  AES_ECB_encrypt(ctx, ptr(block));
  assert.equal(toHex(block), expected);
});

test('NIST SP 800-38A F.2.1: AES-128 CBC encrypts 4 blocks to reference ciphertext', () => {
  const key = hex('2b7e151628aed2a6abf7158809cf4f3c');
  const iv  = hex('000102030405060708090a0b0c0d0e0f');
  const pt = hex(
    '6bc1bee22e409f96e93d7e117393172a' +
    'ae2d8a571e03ac9c9eb76fac45af8e51' +
    '30c81c46a35ce411e5fbc1191a0a52ef' +
    'f69f2445df4f9b17ad2b417be66c3710',
  );
  const expected =
    '7649abac8119b246cee98e9b12e9197d' +
    '5086cb9b507219ee95db113a917678b2' +
    '73bed6b8e3c1743b7116e69e22229516' +
    '3ff1caa1681fac09120eca307586e1a7';
  const buf = new Uint8Array(pt);
  const ctx = new AES_ctx();
  AES_init_ctx_iv(ctx, ptr(key), ptr(iv));
  AES_CBC_encrypt_buffer(ctx, ptr(buf), buf.length);
  assert.equal(toHex(buf), expected);
});

test('NIST SP 800-38A F.2.2: AES-128 CBC decrypts reference ciphertext to plaintext', () => {
  const key = hex('2b7e151628aed2a6abf7158809cf4f3c');
  const iv  = hex('000102030405060708090a0b0c0d0e0f');
  const ct = hex(
    '7649abac8119b246cee98e9b12e9197d' +
    '5086cb9b507219ee95db113a917678b2' +
    '73bed6b8e3c1743b7116e69e22229516' +
    '3ff1caa1681fac09120eca307586e1a7',
  );
  const expected =
    '6bc1bee22e409f96e93d7e117393172a' +
    'ae2d8a571e03ac9c9eb76fac45af8e51' +
    '30c81c46a35ce411e5fbc1191a0a52ef' +
    'f69f2445df4f9b17ad2b417be66c3710';
  const buf = new Uint8Array(ct);
  const ctx = new AES_ctx();
  AES_init_ctx_iv(ctx, ptr(key), ptr(iv));
  AES_CBC_decrypt_buffer(ctx, ptr(buf), buf.length);
  assert.equal(toHex(buf), expected);
});

test('NIST SP 800-38A F.5.1: AES-128 CTR encrypts 4 blocks to reference ciphertext', () => {
  const key = hex('2b7e151628aed2a6abf7158809cf4f3c');
  const iv  = hex('f0f1f2f3f4f5f6f7f8f9fafbfcfdfeff');
  const pt = hex(
    '6bc1bee22e409f96e93d7e117393172a' +
    'ae2d8a571e03ac9c9eb76fac45af8e51' +
    '30c81c46a35ce411e5fbc1191a0a52ef' +
    'f69f2445df4f9b17ad2b417be66c3710',
  );
  const expected =
    '874d6191b620e3261bef6864990db6ce' +
    '9806f66b7970fdff8617187bb9fffdff' +
    '5ae4df3edbd5d35e5b4f09020db03eab' +
    '1e031dda2fbe03d1792170a0f3009cee';
  const buf = new Uint8Array(pt);
  const ctx = new AES_ctx();
  AES_init_ctx_iv(ctx, ptr(key), ptr(iv));
  AES_CTR_xcrypt_buffer(ctx, ptr(buf), buf.length);
  assert.equal(toHex(buf), expected);
});

test('AES-128 CTR is symmetric: applying twice with same key+IV recovers plaintext', () => {
  const key = hex('2b7e151628aed2a6abf7158809cf4f3c');
  const iv  = hex('f0f1f2f3f4f5f6f7f8f9fafbfcfdfeff');
  const pt = hex(
    '6bc1bee22e409f96e93d7e117393172a' +
    'ae2d8a571e03ac9c9eb76fac45af8e51',
  );
  const buf = new Uint8Array(pt);
  const ctx = new AES_ctx();
  AES_init_ctx_iv(ctx, ptr(key), ptr(iv));
  AES_CTR_xcrypt_buffer(ctx, ptr(buf), buf.length);
  // Re-init IV (encrypt advanced it) and decrypt by re-applying CTR.
  AES_init_ctx_iv(ctx, ptr(key), ptr(iv));
  AES_CTR_xcrypt_buffer(ctx, ptr(buf), buf.length);
  assert.deepEqual(Array.from(buf), Array.from(pt));
});
