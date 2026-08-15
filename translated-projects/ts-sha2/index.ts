/**
 * ts-sha2
 *
 * A zero-dependency TypeScript port of the SHA-256 hash algorithm
 * (FIPS PUB 180-4). Translated from a public-domain C reference
 * implementation. Validates against the NIST FIPS 180-4 test vectors.
 *
 * Original C: copyright (c) Brad Conte (B-Con/crypto-algorithms),
 * public domain.
 * TypeScript translation: copyright (c) 2026 Scott Moore, released
 * under the MIT license.
 *
 * See: https://github.com/B-Con/crypto-algorithms
 */

import * as core from './sha256.js';

/** Hex string convenience: returns the SHA-256 digest of `input` as a
 *  lower-case 64-character hex string. */
export function sha256Hex(input: string | Uint8Array): string {
  const bytes = sha256(input);
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, '0');
  }
  return out;
}

/** Computes the SHA-256 digest of `input` and returns it as a 32-byte
 *  Uint8Array. `input` may be either a UTF-8 string or a Uint8Array of
 *  raw bytes. */
export function sha256(input: string | Uint8Array): Uint8Array {
  const data = typeof input === 'string'
    ? new TextEncoder().encode(input)
    : input;
  const ctx = new core.SHA256_CTX();
  core.sha256_init(ctx);
  core.sha256_update(ctx, { buf: data, off: 0 }, data.length);
  const out = new Uint8Array(32);
  core.sha256_final(ctx, { buf: out, off: 0 });
  return out;
}

/** Streaming SHA-256 hasher. Call `.update()` repeatedly with chunks,
 *  then `.digest()` once to get the final 32-byte result. After
 *  `.digest()` the instance must not be reused. */
export class Sha256 {
  private _ctx: any;
  private _finalised = false;
  constructor() {
    this._ctx = new core.SHA256_CTX();
    core.sha256_init(this._ctx);
  }
  update(chunk: string | Uint8Array): this {
    if (this._finalised) {
      throw new Error('Sha256: update called after digest');
    }
    const data = typeof chunk === 'string'
      ? new TextEncoder().encode(chunk)
      : chunk;
    core.sha256_update(this._ctx, { buf: data, off: 0 }, data.length);
    return this;
  }
  digest(): Uint8Array {
    if (this._finalised) {
      throw new Error('Sha256: digest called twice');
    }
    this._finalised = true;
    const out = new Uint8Array(32);
    core.sha256_final(this._ctx, { buf: out, off: 0 });
    return out;
  }
  digestHex(): string {
    const b = this.digest();
    let s = '';
    for (let i = 0; i < b.length; i++) s += b[i].toString(16).padStart(2, '0');
    return s;
  }
}

/** Output size in bytes of a SHA-256 digest. */
export const SHA256_DIGEST_SIZE = 32;
