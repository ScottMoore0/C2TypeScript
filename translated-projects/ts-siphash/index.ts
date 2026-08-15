/**
 * ts-siphash
 *
 * A zero-dependency TypeScript port of SipHash, the keyed pseudorandom
 * function (PRF) by Jean-Philippe Aumasson and Daniel J. Bernstein.
 * Implements SipHash-2-4 with 64-bit and 128-bit output.
 *
 * Original C: copyright (c) 2012-2022 Jean-Philippe Aumasson and
 * 2012-2014 Daniel J. Bernstein, dedicated to the public domain via
 * CC0 1.0.
 * TypeScript translation: copyright (c) 2026 Scott Moore, also
 * released under CC0 1.0.
 *
 * See: https://github.com/veorq/SipHash
 */

// Re-export the core siphash function from the translated module.
// Signature:
//   siphash(in: CPtr, inlen: number, k: CPtr, out: CPtr, outlen: number): number
// where CPtr is the shape `{ buf: Uint8Array; off: number }` mirroring
// the original C `const void *` / `uint8_t *` pointer semantics.
// `outlen` must be 8 (SipHash-64) or 16 (SipHash-128).
export { siphash } from './siphash.js';
