# ts-soundex

A direct TypeScript port of zoundx — classical American Soundex phonetic name encoding.

If you find this project useful, you can support this and further ports at [ko-fi.com/scottmoore0](https://ko-fi.com/scottmoore0).

## Upstream provenance

This package is a TypeScript port of [BlurryRoots/zoundx](https://github.com/BlurryRoots/zoundx) (`zoundx.c`, `zoundx.h`, `util.c`), MIT License.

The translated output is validated against canonical Knuth TAOCP vol 3 §6.1 reference table entries.

## Why this exists

Soundex is a phonetic indexing algorithm: two names that sound alike when spoken English produce the same code. Originally patented for US Census records (Russell 1918), it is still widely used in:

- US Census and Social Security records
- Genealogy systems (Ancestry, FamilySearch)
- Many SQL databases offer `SOUNDEX()` as a built-in (SQL Server, Oracle, PostgreSQL, MySQL)
- Fuzzy customer-record matching ("Robert" finds "Rupert")

## Install

```bash
npm install ts-soundex
```

## Usage

```typescript
import { soundex } from 'ts-soundex';

soundex('Robert');    // 'R163'
soundex('Rupert');    // 'R163' — same code, "sound-alike" name
soundex('Smith');     // 'S530'
soundex('Smyth');     // 'S530' — same code

// Common matching pattern
const matches = (a: string, b: string) => soundex(a) === soundex(b);
matches('Robert', 'Rupert');  // true
matches('Catherine', 'Katherine');  // true
```

## API surface

- `soundex(name: string): string` — returns a 4-character code `[A-Z][0-9][0-9][0-9]`, or `""` for an empty input.

The output is always exactly 4 characters for non-empty input: the original first letter (uppercased) plus three encoded digits.

## Reference values

| Name | Soundex |
|---|---|
| `Robert` | `R163` |
| `Rupert` | `R163` |
| `Rubin` | `R150` |
| `Ashcraft` | `A261` |
| `Tymczak` | `T522` |
| `Honeyman` | `H555` |

## Caveats

- **Classical (Russell) variant.** This is the original "American Soundex" algorithm, not the slightly different NARA/Census 1880 variant which has special H/W rules. For most fuzzy-match use cases the difference doesn't matter; for genealogy work that explicitly references NARA, prefer a NARA-specific implementation.
- **First letter is preserved, not encoded.** `soundex("Cat")` = `C300`, not `K300`. Two names starting with different letters never match by Soundex, even if they sound alike (e.g. "Catherine" vs "Katherine" differ in their codes despite sounding similar).
- **English-centric.** Soundex was designed for English surnames. For non-English names, prefer Metaphone or specialised variants.

## License

MIT. Original C by BlurryRoots under MIT.

## See also

- [ts-levenshtein](https://github.com/ScottMoore0/ts-levenshtein) — edit-distance string similarity
- [ts-damerau-levenshtein](https://github.com/ScottMoore0/ts-damerau-levenshtein) — typo-aware edit distance
- [cpp-to-ts](https://github.com/ScottMoore0/cpp-to-ts) — the translator that produced this package
