/**
 * ts-ripemd160 — TypeScript port of DaveCTurner/tiny-ripemd160.
 *
 * Upstream: https://github.com/DaveCTurner/tiny-ripemd160 (MIT)
 * Algorithm: RIPEMD-160 by Dobbertin, Bosselaers, Preneel (1996).
 *
 * RIPEMD-160 is widely deployed alongside SHA-256 in cryptocurrency
 * (Bitcoin addresses use HASH160 = RIPEMD160(SHA256(pubkey))), TLS,
 * and PGP key fingerprinting.
 */
import { ripemd160 as ripemd160_c } from './ripemd160.js';

const RIPEMD160_DIGEST_SIZE = 20;

function toBytes(input: Uint8Array | string): Uint8Array {
  return typeof input === 'string' ? new TextEncoder().encode(input) : input;
}

/**
 * Compute the RIPEMD-160 hash of the input. Returns the 20-byte digest.
 */
export function ripemd160(input: Uint8Array | string): Uint8Array {
  const data = toBytes(input);
  const out = new Uint8Array(RIPEMD160_DIGEST_SIZE);
  ripemd160_c({ buf: data, off: 0 }, data.length, { buf: out, off: 0 });
  return out;
}

/** RIPEMD-160 as a 40-character lowercase hex string. */
export function ripemd160Hex(input: Uint8Array | string): string {
  const bytes = ripemd160(input);
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += bytes[i].toString(16).padStart(2, '0');
  return s;
}

export { RIPEMD160_DIGEST_SIZE };
