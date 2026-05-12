/**
 * ts-damerau-levenshtein — TypeScript port of anton-tchekov/levenshtein.
 *
 * Upstream: https://github.com/anton-tchekov/levenshtein (MIT)
 *
 * Provides both the standard Levenshtein edit distance (insertions,
 * deletions, substitutions) and the "Optimal String Alignment"
 * Damerau-Levenshtein variant, which additionally counts a transposition
 * of two adjacent characters as a single edit.
 *
 * OSA Damerau is the variant used by most spell-checkers and fuzzy
 * search systems. (The "true" Damerau-Levenshtein, which allows
 * substring edits across transposed positions, is a different algorithm
 * with O(n*m*sigma) memory; the OSA variant is the practical one.)
 */
import { levenshtein, damerau_levenshtein } from './levenshtein.js';

/**
 * Plain Levenshtein edit distance. Counts insertions, deletions, and
 * substitutions as cost 1 each; transpositions cost 2.
 */
export function distance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  return levenshtein(a, b);
}

/**
 * Damerau-Levenshtein (OSA variant). Same as `distance` but transposing
 * two adjacent characters costs only 1 instead of 2.
 *
 * Examples:
 *   damerauDistance("ab", "ba")  === 1   // transposition
 *   damerauDistance("abc", "acb") === 1  // transposition of last two
 *   distance("ab", "ba")          === 2   // (1 delete + 1 insert)
 */
export function damerauDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  return damerau_levenshtein(a, b);
}

/** Normalised in [0, 1]: 0 = identical, 1 = entirely different. */
export function normalisedDistance(a: string, b: string): number {
  const max = Math.max(a.length, b.length);
  if (max === 0) return 0;
  return distance(a, b) / max;
}

export function normalisedDamerauDistance(a: string, b: string): number {
  const max = Math.max(a.length, b.length);
  if (max === 0) return 0;
  return damerauDistance(a, b) / max;
}

/** Similarity score in [0, 1]: 1 = identical, 0 = entirely different. */
export function similarity(a: string, b: string): number {
  return 1 - normalisedDistance(a, b);
}

export function damerauSimilarity(a: string, b: string): number {
  return 1 - normalisedDamerauDistance(a, b);
}
