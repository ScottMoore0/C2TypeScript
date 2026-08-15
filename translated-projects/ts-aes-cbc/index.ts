/**
 * ts-aes-cbc — TypeScript port of WjCryptLib's AES-CBC.
 *
 * Upstream: https://github.com/WaterJuice/WjCryptLib (Unlicense)
 * Spec: NIST SP 800-38A §6.2 — Cipher Block Chaining.
 *
 * Bundles the FIPS 197 AES core with the CBC mode wrapper. Validated
 * against NIST SP 800-38A §F.2.1 test vectors.
 */
import {
  AesCbcContext,
  AesCbcEncryptWithKey,
  AesCbcDecryptWithKey,
  AesCbcInitialiseWithKey,
  AesCbcEncrypt,
  AesCbcDecrypt,
} from './aescbc.js';

const AES_BLOCK_SIZE = 16;

function validateKeyLen(key: Uint8Array) {
  if (key.length !== 16 && key.length !== 24 && key.length !== 32) {
    throw new RangeError('AES key must be 16, 24, or 32 bytes (AES-128/192/256)');
  }
}

/**
 * One-shot AES-CBC encryption. Input length must be a multiple of 16
 * (no padding is applied — apply PKCS#7 or your protocol's padding
 * yourself before calling).
 */
export function aesCbcEncrypt(key: Uint8Array, iv: Uint8Array, plaintext: Uint8Array): Uint8Array {
  validateKeyLen(key);
  if (iv.length !== AES_BLOCK_SIZE) throw new RangeError('IV must be 16 bytes');
  if (plaintext.length % AES_BLOCK_SIZE !== 0) {
    throw new RangeError('CBC plaintext length must be a multiple of 16');
  }
  const out = new Uint8Array(plaintext.length);
  // The function consumes the IV — pass a copy
  const ivCopy = new Uint8Array(iv);
  const rc = AesCbcEncryptWithKey(
    { buf: key, off: 0 }, key.length,
    { buf: ivCopy, off: 0 },
    { buf: plaintext, off: 0 },
    { buf: out, off: 0 },
    plaintext.length,
  );
  if (rc !== 0) throw new Error(`AesCbcEncryptWithKey failed (rc=${rc})`);
  return out;
}

/** One-shot AES-CBC decryption. */
export function aesCbcDecrypt(key: Uint8Array, iv: Uint8Array, ciphertext: Uint8Array): Uint8Array {
  validateKeyLen(key);
  if (iv.length !== AES_BLOCK_SIZE) throw new RangeError('IV must be 16 bytes');
  if (ciphertext.length % AES_BLOCK_SIZE !== 0) {
    throw new RangeError('CBC ciphertext length must be a multiple of 16');
  }
  const out = new Uint8Array(ciphertext.length);
  const ivCopy = new Uint8Array(iv);
  const rc = AesCbcDecryptWithKey(
    { buf: key, off: 0 }, key.length,
    { buf: ivCopy, off: 0 },
    { buf: ciphertext, off: 0 },
    { buf: out, off: 0 },
    ciphertext.length,
  );
  if (rc !== 0) throw new Error(`AesCbcDecryptWithKey failed (rc=${rc})`);
  return out;
}

/**
 * Streaming CBC encryptor. Useful for processing data in chunks.
 * Each call's input length must be a multiple of 16.
 */
export class AesCbcEncryptor {
  private ctx: AesCbcContext;

  constructor(key: Uint8Array, iv: Uint8Array) {
    validateKeyLen(key);
    if (iv.length !== AES_BLOCK_SIZE) throw new RangeError('IV must be 16 bytes');
    this.ctx = new AesCbcContext();
    const rc = AesCbcInitialiseWithKey(
      this.ctx,
      { buf: key, off: 0 }, key.length,
      { buf: new Uint8Array(iv), off: 0 },
    );
    if (rc !== 0) throw new Error(`AesCbcInitialiseWithKey failed (rc=${rc})`);
  }

  encrypt(plaintext: Uint8Array): Uint8Array {
    if (plaintext.length % AES_BLOCK_SIZE !== 0) {
      throw new RangeError('chunk length must be a multiple of 16');
    }
    const out = new Uint8Array(plaintext.length);
    const rc = AesCbcEncrypt(this.ctx, { buf: plaintext, off: 0 }, { buf: out, off: 0 }, plaintext.length);
    if (rc !== 0) throw new Error(`AesCbcEncrypt failed (rc=${rc})`);
    return out;
  }

  decrypt(ciphertext: Uint8Array): Uint8Array {
    if (ciphertext.length % AES_BLOCK_SIZE !== 0) {
      throw new RangeError('chunk length must be a multiple of 16');
    }
    const out = new Uint8Array(ciphertext.length);
    const rc = AesCbcDecrypt(this.ctx, { buf: ciphertext, off: 0 }, { buf: out, off: 0 }, ciphertext.length);
    if (rc !== 0) throw new Error(`AesCbcDecrypt failed (rc=${rc})`);
    return out;
  }
}

export { AES_BLOCK_SIZE };
