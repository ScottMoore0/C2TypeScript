/**
 * ts-arcfour — TypeScript port of Brad Conte's ARCFOUR (RC4) reference.
 *
 * Upstream: https://github.com/B-Con/crypto-algorithms (public domain)
 *
 * RC4 / ARCFOUR is cryptographically broken (RFC 7465 forbids it in TLS).
 * This package exists for interop with legacy systems and for educational
 * use, NOT for new cryptographic designs.
 */
import { arcfour_key_setup, arcfour_generate_stream } from './arcfour.js';

const ARCFOUR_STATE_SIZE = 256;

function toBytes(input: Uint8Array | string): Uint8Array {
  return typeof input === 'string' ? new TextEncoder().encode(input) : input;
}

/**
 * A keyed ARCFOUR keystream generator. RC4 is a synchronous stream
 * cipher — encryption and decryption are both XOR-with-keystream, so a
 * single class handles both directions.
 */
export class Arcfour {
  private state: Uint8Array;

  constructor(key: Uint8Array | string) {
    const keyBytes = toBytes(key);
    if (keyBytes.length < 1 || keyBytes.length > 256) {
      throw new RangeError('ARCFOUR key length must be 1..256 bytes');
    }
    this.state = new Uint8Array(ARCFOUR_STATE_SIZE);
    arcfour_key_setup({ buf: this.state, off: 0 }, { buf: keyBytes, off: 0 }, keyBytes.length);
  }

  /**
   * Emit `len` bytes of keystream into a new Uint8Array. State advances.
   */
  generate(len: number): Uint8Array {
    if (!Number.isInteger(len) || len < 0) throw new RangeError('len must be a non-negative integer');
    const out = new Uint8Array(len);
    if (len > 0) arcfour_generate_stream({ buf: this.state, off: 0 }, { buf: out, off: 0 }, len);
    return out;
  }

  /**
   * Encrypt or decrypt `data` by XOR-ing it with the next len bytes of
   * keystream. Returns a fresh Uint8Array; the input is not mutated.
   */
  process(data: Uint8Array | string): Uint8Array {
    const bytes = toBytes(data);
    const ks = this.generate(bytes.length);
    const out = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) out[i] = bytes[i] ^ ks[i];
    return out;
  }
}

/**
 * One-shot helper: derive `len` bytes of keystream from `key`.
 */
export function arcfourKeystream(key: Uint8Array | string, len: number): Uint8Array {
  return new Arcfour(key).generate(len);
}

/**
 * One-shot helper: encrypt or decrypt `data` with `key`.
 */
export function arcfourProcess(key: Uint8Array | string, data: Uint8Array | string): Uint8Array {
  return new Arcfour(key).process(data);
}

export { arcfour_key_setup, arcfour_generate_stream };
