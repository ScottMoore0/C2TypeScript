/**
 * ts-bos-base64 — TypeScript port of BabyOS algo_base64.c.
 *
 * Upstream: https://github.com/notrynohigh/BabyOS  (MIT)
 * Copyright (c) 2020 Bean (notrynohigh@outlook.com)
 *
 * RFC 4648 §4 Base64 encoder / decoder. The decoder uses a partial-byte
 * accumulator (`out[j++] |= …`) — translated correctly via the
 * single-LHS-evaluation rule of C17 §6.5.16.2 p3.
 */
import { base64_encode, base64_decode } from './base64.js';

function toBytes(input: Uint8Array | string): Uint8Array {
  return typeof input === 'string' ? new TextEncoder().encode(input) : input;
}

/** Encode bytes (or a UTF-8 string) to Base64. */
export function encode(input: Uint8Array | string): string {
  const bytes = toBytes(input);
  // BabyOS encoder writes `out[j] = 0;` as a terminator (C-string convention),
  // so allocate +1.
  const outLen = 4 * Math.ceil(bytes.length / 3);
  const out = new Uint8Array(outLen + 1);
  const written = base64_encode({ buf: bytes, off: 0 }, bytes.length, { buf: out, off: 0 });
  // Decode the UTF-8 bytes of `out[0..written]` back to a JS string.
  return new TextDecoder().decode(out.subarray(0, written));
}

/**
 * Decode Base64 to bytes. Returns `null` if the input is malformed (illegal
 * character or length not a multiple of 4).
 */
export function decode(input: string): Uint8Array | null {
  const inBytes = new TextEncoder().encode(input);
  if ((inBytes.length & 0x3) !== 0) return null;
  const out = new Uint8Array(Math.floor(inBytes.length * 3 / 4));
  const written = base64_decode({ buf: inBytes, off: 0 }, inBytes.length, { buf: out, off: 0 });
  if (written === 0 && inBytes.length > 0) return null;
  return out.subarray(0, written);
}

/** Decode Base64 to a UTF-8 string. Returns `null` on malformed input. */
export function decodeToString(input: string): string | null {
  const b = decode(input);
  return b == null ? null : new TextDecoder().decode(b);
}
