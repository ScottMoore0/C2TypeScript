# ts-damerau-levenshtein

A direct TypeScript port of Anton Tchekov's [levenshtein](https://github.com/anton-tchekov/levenshtein) library — providing both Levenshtein and Damerau-Levenshtein (OSA variant) edit distances.

If you find this project useful, you can support this and further ports at [ko-fi.com/scottmoore0](https://ko-fi.com/scottmoore0).

## Upstream provenance

Direct port of [anton-tchekov/levenshtein](https://github.com/anton-tchekov/levenshtein) (`levenshtein.c`, `levenshtein.h`), MIT License.

The translated output is validated against textbook reference distances and adjacent-transposition test cases.

## Why this exists

Damerau-Levenshtein is the **right** edit distance for typo correction. Classic Levenshtein treats `"teh" → "the"` as distance 2 (delete `e`, insert `e` after `t`). Damerau-Levenshtein recognises the adjacent-character swap as a single edit, so `damerauDistance("teh", "the") === 1`. This matches how humans think about typos.

This package uses the **Optimal String Alignment** variant (OSA), which is the practical version used by most spell-checkers. The "true" Damerau-Levenshtein requires O(n×m×|Σ|) memory and is rarely worth the cost.

## Install

```bash
npm install ts-damerau-levenshtein
```

## Usage

```typescript
import { distance, damerauDistance, similarity, damerauSimilarity } from 'ts-damerau-levenshtein';

distance('teh', 'the');           // 2 (delete + insert)
damerauDistance('teh', 'the');    // 1 (one transposition)

distance('kitten', 'sitting');    // 3
damerauDistance('kitten', 'sitting'); // 3 (no transpositions)

damerauSimilarity('teh', 'the');  // 0.6666... (1 - 1/3)
```

## API surface

- `distance(a, b): number` — plain Levenshtein.
- `damerauDistance(a, b): number` — Damerau-Levenshtein OSA.
- `normalisedDistance(a, b): number` and `normalisedDamerauDistance(a, b)` — distance / max(len), in `[0, 1]`.
- `similarity(a, b): number` and `damerauSimilarity(a, b)` — `1 - normalised`, in `[0, 1]`.

## Reference values

| a | b | Levenshtein | Damerau-OSA |
|---|---|---|---|
| `""` | `""` | 0 | 0 |
| `"ab"` | `"ba"` | 2 | **1** |
| `"abc"` | `"acb"` | 2 | **1** |
| `"teh"` | `"the"` | 2 | **1** |
| `"recieve"` | `"receive"` | 2 | **1** |
| `"kitten"` | `"sitting"` | 3 | 3 |
| `"Saturday"` | `"Sunday"` | 3 | 3 |

Run:
```bash
npm test
```

## Caveats

- **OSA variant**, not "true" Damerau-Levenshtein. OSA forbids editing a substring more than once. The difference shows up on inputs like `"CA" → "ABC"`: OSA says 3, true Damerau says 2. For 99% of fuzzy-matching use cases OSA is what you want.
- **Bytes, not graphemes.** Same Unicode caveat as plain Levenshtein. Normalise to NFC before comparing if you're matching strings with combining diacritics.
- **O(n×m) time.** Quadratic in input lengths.

## License

MIT. Original C by Anton Tchekov under MIT.

## See also

- [ts-levenshtein](https://github.com/ScottMoore0/ts-levenshtein) — plain Wagner-Fischer Levenshtein
- [cpp-to-ts](https://github.com/ScottMoore0/cpp-to-ts) — the translator that produced this package
