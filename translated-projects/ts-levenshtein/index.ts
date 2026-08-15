/**
 * ts-levenshtein — TypeScript port of wooorm/levenshtein.c.
 *
 * Upstream: https://github.com/wooorm/levenshtein.c (MIT)
 * Algorithm: Levenshtein edit distance (Wagner-Fischer, O(n*m) time,
 * O(min(n,m)) space).
 */
import { levenshtein, levenshtein_n } from './levenshtein.js';

/**
 * Compute the Levenshtein edit distance between two strings.
 *
 * The distance is the minimum number of single-character insertions,
 * deletions, or substitutions needed to transform `a` into `b`. Equal
 * inputs return 0; one empty + one length-N input returns N.
 *
 * @param a  Source string.
 * @param b  Target string.
 * @returns  Edit distance as a non-negative integer.
 */
export function distance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  return levenshtein(a, b);
}

/**
 * Lower-level: edit distance with explicit lengths. Useful when you
 * have raw byte buffers rather than JS strings.
 */
export function distanceN(
  a: Uint8Array | string,
  aLen: number,
  b: Uint8Array | string,
  bLen: number,
): number {
  const ab = typeof a === 'string' ? a : { buf: a, off: 0 };
  const bb = typeof b === 'string' ? b : { buf: b, off: 0 };
  return levenshtein_n(ab, aLen, bb, bLen);
}

/**
 * Normalised distance in [0, 1]: 0 = identical, 1 = completely different.
 * Defined as `distance(a, b) / max(a.length, b.length)`, with the
 * convention that two empty strings yield 0.
 */
export function normalisedDistance(a: string, b: string): number {
  const max = Math.max(a.length, b.length);
  if (max === 0) return 0;
  return distance(a, b) / max;
}

/**
 * Similarity score in [0, 1]: 1 = identical, 0 = completely different.
 * Equal to `1 - normalisedDistance(a, b)`.
 */
export function similarity(a: string, b: string): number {
  return 1 - normalisedDistance(a, b);
}
