/**
 * ts-blake2s — TypeScript port of mjosaarinen/blake2_mjosref BLAKE2s.
 *
 * Upstream: https://github.com/mjosaarinen/blake2_mjosref (CC0 1.0 Universal)
 * Spec: RFC 7693 ("The BLAKE2 Cryptographic Hash and Message Authentication Code").
 *
 * BLAKE2s is a cryptographic hash function optimised for 32-bit platforms
 * (8-32 byte output). For 64-bit platforms or longer outputs, use BLAKE2b.
 */
import { blake2s_ctx, blake2s_init, blake2s_update, blake2s_final } from './blake2s.js';

function toBytes(input: Uint8Array | string): Uint8Array {
  return typeof input === 'string' ? new TextEncoder().encode(input) : input;
}

function toHex(b: Uint8Array): string {
  let s = '';
  for (let i = 0; i < b.length; i++) s += b[i].toString(16).padStart(2, '0');
  return s;
}

/**
 * One-shot BLAKE2s hash.
 *
 * @param input    Bytes (or string, UTF-8 encoded) to hash.
 * @param outlen   Digest size in bytes, 1..32. Default 32.
 * @param key      Optional secret key (MAC mode), 0..32 bytes.
 * @returns        Digest as a Uint8Array of length `outlen`.
 */
export function blake2s(
  input: Uint8Array | string,
  outlen: number = 32,
  key: Uint8Array = new Uint8Array(0),
): Uint8Array {
  if (!Number.isInteger(outlen) || outlen < 1 || outlen > 32) {
    throw new RangeError('BLAKE2s outlen must be an integer 1..32');
  }
  if (key.length > 32) {
    throw new RangeError('BLAKE2s key length must be <= 32');
  }
  const ctx = new blake2s_ctx();
  const bytes = toBytes(input);
  const rc = blake2s_init(ctx, outlen, key.length > 0 ? { buf: key, off: 0 } : null, key.length);
  if (rc !== 0) throw new Error('blake2s_init failed');
  blake2s_update(ctx, { buf: bytes, off: 0 }, bytes.length);
  const out = new Uint8Array(outlen);
  blake2s_final(ctx, { buf: out, off: 0 });
  return out;
}

/** One-shot BLAKE2s producing a hex-encoded digest. */
export function blake2sHex(
  input: Uint8Array | string,
  outlen: number = 32,
  key: Uint8Array = new Uint8Array(0),
): string {
  return toHex(blake2s(input, outlen, key));
}

/**
 * Streaming BLAKE2s. Call `update()` any number of times with bytes, then
 * `digest()` to produce the final hash.
 */
export class Blake2s {
  private ctx: blake2s_ctx;
  private outlen: number;
  private finished = false;

  constructor(outlen: number = 32, key: Uint8Array = new Uint8Array(0)) {
    if (!Number.isInteger(outlen) || outlen < 1 || outlen > 32) {
      throw new RangeError('BLAKE2s outlen must be an integer 1..32');
    }
    if (key.length > 32) {
      throw new RangeError('BLAKE2s key length must be <= 32');
    }
    this.outlen = outlen;
    this.ctx = new blake2s_ctx();
    const rc = blake2s_init(this.ctx, outlen, key.length > 0 ? { buf: key, off: 0 } : null, key.length);
    if (rc !== 0) throw new Error('blake2s_init failed');
  }

  update(data: Uint8Array | string): this {
    if (this.finished) throw new Error('Blake2s: update() after digest()');
    const bytes = toBytes(data);
    blake2s_update(this.ctx, { buf: bytes, off: 0 }, bytes.length);
    return this;
  }

  digest(): Uint8Array {
    if (this.finished) throw new Error('Blake2s: digest() called twice');
    this.finished = true;
    const out = new Uint8Array(this.outlen);
    blake2s_final(this.ctx, { buf: out, off: 0 });
    return out;
  }

  hexDigest(): string {
    return toHex(this.digest());
  }
}
