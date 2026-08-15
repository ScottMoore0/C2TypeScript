/**
 * ts-aes-ofb — TypeScript port of WjCryptLib's AES-OFB.
 *
 * Upstream: https://github.com/WaterJuice/WjCryptLib (Unlicense)
 * Spec: NIST SP 800-38A §6.4 — Output Feedback.
 *
 * OFB turns AES into a stream cipher by feeding the encryption output
 * back as the next input. Symmetric encrypt/decrypt (XOR with keystream).
 */
import { AesOfbContext, AesOfbInitialiseWithKey, AesOfbXor, AesOfbXorWithKey } from './aesofb.js';

const AES_BLOCK_SIZE = 16;

function validateKeyLen(key: Uint8Array) {
  if (key.length !== 16 && key.length !== 24 && key.length !== 32) {
    throw new RangeError('AES key must be 16, 24, or 32 bytes');
  }
}

/**
 * One-shot AES-OFB. Symmetric — same function encrypts and decrypts.
 * Input length is arbitrary (no block-multiple requirement; OFB is a
 * stream cipher).
 */
export function aesOfb(key: Uint8Array, iv: Uint8Array, data: Uint8Array): Uint8Array {
  validateKeyLen(key);
  if (iv.length !== AES_BLOCK_SIZE) throw new RangeError('IV must be 16 bytes');
  const out = new Uint8Array(data.length);
  const ivCopy = new Uint8Array(iv);
  const rc = AesOfbXorWithKey(
    { buf: key, off: 0 }, key.length,
    { buf: ivCopy, off: 0 },
    { buf: data, off: 0 },
    { buf: out, off: 0 },
    data.length,
  );
  if (rc !== 0) throw new Error(`AesOfbXorWithKey failed (rc=${rc})`);
  return out;
}

/** Streaming OFB. Useful for processing data in arbitrary chunks. */
export class AesOfb {
  private ctx: AesOfbContext;

  constructor(key: Uint8Array, iv: Uint8Array) {
    validateKeyLen(key);
    if (iv.length !== AES_BLOCK_SIZE) throw new RangeError('IV must be 16 bytes');
    this.ctx = new AesOfbContext();
    const rc = AesOfbInitialiseWithKey(
      this.ctx,
      { buf: key, off: 0 }, key.length,
      { buf: new Uint8Array(iv), off: 0 },
    );
    if (rc !== 0) throw new Error(`AesOfbInitialiseWithKey failed (rc=${rc})`);
  }

  /** Encrypt or decrypt a chunk (symmetric). */
  process(data: Uint8Array): Uint8Array {
    const out = new Uint8Array(data.length);
    AesOfbXor(this.ctx, { buf: data, off: 0 }, { buf: out, off: 0 }, data.length);
    return out;
  }
}

export { AES_BLOCK_SIZE };
