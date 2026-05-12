/**
 * ts-sha512 — TypeScript port of WjCryptLib's SHA-512 reference.
 *
 * Upstream: https://github.com/WaterJuice/WjCryptLib (Unlicense)
 * Algorithm: FIPS 180-4 / RFC 6234.
 */
import { Sha512Context, SHA512_HASH, Sha512Initialise, Sha512Update, Sha512Finalise } from './sha512.js';

const SHA512_DIGEST_SIZE = 64;

function toBytes(input: Uint8Array | string): Uint8Array {
  return typeof input === 'string' ? new TextEncoder().encode(input) : input;
}

function digestBytes(hash: SHA512_HASH): Uint8Array {
  const out = new Uint8Array(SHA512_DIGEST_SIZE);
  const view = hash.bytes;
  // SHA512_HASH stores its bytes as a 64-byte CPtr-shaped buffer
  for (let i = 0; i < SHA512_DIGEST_SIZE; i++) {
    out[i] = view.buf[(view.off ?? 0) + i] & 0xff;
  }
  return out;
}

/** One-shot SHA-512: returns the 64-byte digest of the input. */
export function sha512(input: Uint8Array | string): Uint8Array {
  const data = toBytes(input);
  const ctx = new Sha512Context();
  Sha512Initialise(ctx);
  if (data.length > 0) Sha512Update(ctx, { buf: data, off: 0 }, data.length);
  const hash = new SHA512_HASH();
  Sha512Finalise(ctx, hash);
  return digestBytes(hash);
}

/** SHA-512 as a 128-char lowercase hex string. */
export function sha512Hex(input: Uint8Array | string): string {
  const bytes = sha512(input);
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += bytes[i].toString(16).padStart(2, '0');
  return s;
}

/**
 * Streaming SHA-512. Create a new `Sha512` per message.
 */
export class Sha512 {
  private ctx = new Sha512Context();
  private finalized = false;

  constructor() { Sha512Initialise(this.ctx); }

  update(chunk: Uint8Array | string): this {
    if (this.finalized) throw new Error('Sha512 already finalized');
    const data = toBytes(chunk);
    if (data.length > 0) Sha512Update(this.ctx, { buf: data, off: 0 }, data.length);
    return this;
  }

  digest(): Uint8Array {
    if (this.finalized) throw new Error('Sha512 already finalized');
    this.finalized = true;
    const hash = new SHA512_HASH();
    Sha512Finalise(this.ctx, hash);
    return digestBytes(hash);
  }

  hexDigest(): string {
    const bytes = this.digest();
    let s = '';
    for (let i = 0; i < bytes.length; i++) s += bytes[i].toString(16).padStart(2, '0');
    return s;
  }
}

export { SHA512_DIGEST_SIZE };
