# ts-levenshtein

A direct TypeScript port of [wooorm/levenshtein.c](https://github.com/wooorm/levenshtein.c) — Levenshtein edit distance between two strings.

If you find this project useful, you can support this and further ports at [ko-fi.com/scottmoore0](https://ko-fi.com/scottmoore0).

## Upstream provenance

This package is a TypeScript port of Titus Wormer's `levenshtein.c` (MIT licensed). The translated output is validated against classic Wagner-Fischer / Wikipedia reference distances including `distance("kitten", "sitting") == 3` and `distance("intention", "execution") == 5`.

## Why this exists

Levenshtein distance is the most-used string similarity metric — needed for fuzzy search, typo correction, dedup, spellcheck, DNA-sequence alignment, and diff algorithms. The algorithm itself is 30 lines of straightforward dynamic programming, but writing a fast, correct, bug-free version by hand is surprisingly easy to get wrong (off-by-ones in the DP table boundary, allocation handling). This package gives you a mechanical port of an audited reference.

`ts-levenshtein` is a direct mechanical translation from Wormer's C reference via the [cpp-to-ts](https://github.com/ScottMoore0/cpp-to-ts) translator, so its relationship to the algorithm is inspectable.

## Install

```bash
npm install ts-levenshtein
```

## Usage

```typescript
import { distance, normalisedDistance, similarity } from 'ts-levenshtein';

distance('kitten', 'sitting');           // 3
distance('Saturday', 'Sunday');          // 3
distance('flaw', 'lawn');                // 2

// 0 = identical, 1 = entirely different
normalisedDistance('kitten', 'sitting'); // 0.42857... (= 3/7)

// 1 = identical, 0 = entirely different
similarity('abc', 'abc');                // 1
similarity('aaaa', 'bbbb');              // 0
```

## API surface

- `distance(a: string, b: string): number` — Levenshtein edit distance, a non-negative integer.
- `distanceN(a, aLen, b, bLen): number` — explicit-length variant for raw `Uint8Array` input.
- `normalisedDistance(a, b): number` — in `[0, 1]`. Defined as `distance(a, b) / max(a.length, b.length)`. Two empty strings yield 0.
- `similarity(a, b): number` — in `[0, 1]`. Equals `1 - normalisedDistance(a, b)`.

## Reference values

The test suite asserts against:

| a | b | distance |
|---|---|---|
| `""` | `""` | 0 |
| `""` | `"abc"` | 3 |
| `"abc"` | `"abc"` | 0 |
| `"kitten"` | `"sitting"` | 3 |
| `"Saturday"` | `"Sunday"` | 3 |
| `"flaw"` | `"lawn"` | 2 |
| `"intention"` | `"execution"` | 5 |
| `"cat"` | `"car"` | 1 |
| `"cat"` | `"cats"` | 1 |
| `"aaaa"` | `"bbbb"` | 4 |

Plus symmetry (`d(a,b) == d(b,a)`) and triangle inequality (`d(a,c) ≤ d(a,b) + d(b,c)`).

Run:
```bash
npm test
```

## Caveats

- **Levenshtein, not Damerau-Levenshtein.** This counts insertions, deletions, and substitutions. The Damerau-Levenshtein variant also counts adjacent-character transpositions (treating `"ab"→"ba"` as cost 1 instead of 2); for that, use a different package.
- **Time complexity O(n×m).** Quadratic in input lengths. Fine for short strings (<1000 chars); for longer strings consider a different algorithm (e.g., Myers' bit-vector if you only need the score; suffix-based methods if you need many comparisons).
- **Bytes, not Unicode grapheme clusters.** The algorithm operates on the raw byte/char sequence. Strings containing combining diacritics, surrogate pairs, or emoji-with-modifiers may count edits differently than a human would. Normalise to NFC before comparing if this matters.

## License

MIT. Original C by Titus Wormer under MIT.

## See also

- [cpp-to-ts](https://github.com/ScottMoore0/cpp-to-ts) — the translator that produced this package
