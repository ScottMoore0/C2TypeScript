/**
 * ts-chacha20 — TypeScript port of a minimal ChaCha20 stream cipher.
 *
 * Upstream: https://github.com/Ginurx/chacha20-c (public domain)
 * Algorithm: D.J. Bernstein, "ChaCha, a variant of Salsa20".
 * Spec: RFC 8439 (ChaCha20 + Poly1305 for IETF Protocols).
 *
 * This package exposes only ChaCha20 itself (the keystream + XOR layer).
 * For an authenticated cipher use ChaCha20-Poly1305 from a vetted source.
 */
import { chacha20_context, chacha20_init_context, chacha20_xor } from './chacha20.js';

const CHACHA20_KEY_SIZE = 32;
const CHACHA20_NONCE_SIZE = 12;

function toBytes(input: Uint8Array | string): Uint8Array {
  return typeof input === 'string' ? new TextEncoder().encode(input) : input;
}

/**
 * A keyed ChaCha20 keystream generator.
 *
 * ChaCha20 is symmetric — `process()` both encrypts and decrypts.
 */
export class ChaCha20 {
  private ctx: chacha20_context;

  /**
   * @param key      32-byte secret key.
   * @param nonce    12-byte nonce. Must be unique per (key, message).
   * @param counter  Initial block counter (default 0). Per RFC 8439, AEAD
   *                 constructions start the message at counter=1.
   */
  constructor(key: Uint8Array, nonce: Uint8Array, counter: number = 0) {
    if (key.length !== CHACHA20_KEY_SIZE) {
      throw new RangeError(`ChaCha20 key must be ${CHACHA20_KEY_SIZE} bytes`);
    }
    if (nonce.length !== CHACHA20_NONCE_SIZE) {
      throw new RangeError(`ChaCha20 nonce must be ${CHACHA20_NONCE_SIZE} bytes (RFC 8439)`);
    }
    if (!Number.isInteger(counter) || counter < 0) {
      throw new RangeError('counter must be a non-negative integer');
    }
    this.ctx = new chacha20_context();
    chacha20_init_context(this.ctx, { buf: key, off: 0 }, { buf: nonce, off: 0 }, counter);
  }

  /**
   * Encrypt or decrypt `data` by XOR-ing with the keystream. Returns a
   * fresh Uint8Array; the input is not modified. The internal state
   * advances by `data.length` bytes.
   */
  process(data: Uint8Array | string): Uint8Array {
    const bytes = toBytes(data);
    const out = new Uint8Array(bytes);  // copy
    if (out.length > 0) chacha20_xor(this.ctx, { buf: out, off: 0 }, out.length);
    return out;
  }
}

/**
 * One-shot encrypt-or-decrypt with ChaCha20.
 *
 * @param key      32-byte secret key.
 * @param nonce    12-byte nonce.
 * @param data     The plaintext or ciphertext bytes.
 * @param counter  Initial block counter (default 0).
 */
export function chacha20(
  key: Uint8Array,
  nonce: Uint8Array,
  data: Uint8Array | string,
  counter: number = 0,
): Uint8Array {
  return new ChaCha20(key, nonce, counter).process(data);
}

export { CHACHA20_KEY_SIZE, CHACHA20_NONCE_SIZE };
