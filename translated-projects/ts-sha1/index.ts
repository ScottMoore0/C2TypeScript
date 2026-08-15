/**
 * ts-sha1 — TypeScript port of Brad Conte's SHA-1 reference implementation.
 *
 * Upstream: https://github.com/B-Con/crypto-algorithms (public domain)
 * Algorithm: FIPS 180-4 / RFC 3174.
 */
import { SHA1_CTX, sha1_init, sha1_update, sha1_final } from './sha1.js';

const SHA1_DIGEST_SIZE = 20;

function toBytes(input: Uint8Array | string): Uint8Array {
  return typeof input === 'string' ? new TextEncoder().encode(input) : input;
}

/**
 * One-shot SHA-1: returns the 20-byte digest of the input.
 */
export function sha1(input: Uint8Array | string): Uint8Array {
  const data = toBytes(input);
  const ctx = new SHA1_CTX();
  sha1_init(ctx);
  if (data.length > 0) sha1_update(ctx, { buf: data, off: 0 }, data.length);
  const out = new Uint8Array(SHA1_DIGEST_SIZE);
  sha1_final(ctx, { buf: out, off: 0 });
  return out;
}

/** SHA-1 as a 40-char lowercase hex string. */
export function sha1Hex(input: Uint8Array | string): string {
  const bytes = sha1(input);
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += bytes[i].toString(16).padStart(2, '0');
  return s;
}

/**
 * Streaming API. Create a new `Sha1` per message; call `update` zero or
 * more times, then `digest()` once.
 */
export class Sha1 {
  private ctx = new SHA1_CTX();
  private finalized = false;

  constructor() {
    sha1_init(this.ctx);
  }

  update(chunk: Uint8Array | string): this {
    if (this.finalized) throw new Error('Sha1 already finalized');
    const data = toBytes(chunk);
    if (data.length > 0) sha1_update(this.ctx, { buf: data, off: 0 }, data.length);
    return this;
  }

  digest(): Uint8Array {
    if (this.finalized) throw new Error('Sha1 already finalized');
    this.finalized = true;
    const out = new Uint8Array(SHA1_DIGEST_SIZE);
    sha1_final(this.ctx, { buf: out, off: 0 });
    return out;
  }

  hexDigest(): string {
    const bytes = this.digest();
    let s = '';
    for (let i = 0; i < bytes.length; i++) s += bytes[i].toString(16).padStart(2, '0');
    return s;
  }
}

export { SHA1_DIGEST_SIZE };
