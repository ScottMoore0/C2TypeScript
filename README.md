# C2TypeScript

**C2TypeScript is a partial-coverage C-to-TypeScript translator and proof-of-concept. It is not a universal C17 translator.** It handles a meaningful subset of real-world C code (demonstrated below by ports of several published C libraries), but it does not cover the full C17 language, the full C standard library, or the full range of real C codebases.

The translator emits TypeScript that compiles on Node ES2022+ and aims to produce the same observable output as the original C program for the inputs it supports. Output is engineered for *refactorability*: every C-only concept (pointers, value-semantic structs, manual memory, bitfields, unions) is emitted at a marked bridge boundary using a descriptively-named runtime helper, so a human or AI agent can replace foreign encodings with idiomatic TypeScript in isolated passes.

This repository is an inactive experimental snapshot. I am not actively developing C2TypeScript, I do not have plans to finish it, and it should be read as an experiment in what is possible with C-to-TypeScript translation rather than as a maintained compiler project.

---

## Status

**v0.1 - inactive proof-of-concept, partial C17 coverage.** The translator works end-to-end on small-to-medium real-world C libraries (a handful of these have been ported and are linked below). Larger C codebases - notably the Lua 5.4 interpreter at ~20,000 lines - translate but exhibit runtime divergence. Full C17 conformance and full real-world generality were not reached and are not planned.

Treat C2TypeScript as a research artifact: useful for studying one approach to preserving C semantics in TypeScript and for inspecting the demonstrated translations, not as a general C compiler replacement or a maintained dependency.

### Demonstrated working translations

Each of these is a published TypeScript port of a real C library, produced through C2TypeScript. The links below point at the actual ts-* repositories:

| Source C library | Approx. C LOC | TypeScript port |
|---|---|---|
| cJSON | 7,000 | [ts-cJSON](https://github.com/ScottMoore0/ts-cJSON) |
| antirez/sds | 3,000 | [ts-antirez-sds](https://github.com/ScottMoore0/ts-antirez-sds) |
| tiny-aes-c | 1,000 | [ts-tiny-aes](https://github.com/ScottMoore0/ts-tiny-aes) |
| Cyan4973/xxHash | 2,000 | [ts-xxhash](https://github.com/ScottMoore0/ts-xxhash) |
| picohttpparser | 700 | [ts-picohttpparser](https://github.com/ScottMoore0/ts-picohttpparser) |
| chibi base64 | 400 | [ts-chibi-base64](https://github.com/ScottMoore0/ts-chibi-base64) |
| tiny-regex-c | 500 | [ts-tiny-regex-c](https://github.com/ScottMoore0/ts-tiny-regex-c) |
| jsmn | 500 | [ts-jsmn](https://github.com/ScottMoore0/ts-jsmn) |
| parson | 3,500 | [ts-parson](https://github.com/ScottMoore0/ts-parson) |
| FastLZ | 700 | [ts-fastlz](https://github.com/ScottMoore0/ts-fastlz) |

Additional smaller hash / crypto / encoding libraries have also been translated and published; see the `ScottMoore0/ts-*` repositories on GitHub for the full set.

### Known limits

- Larger C codebases (for example the Lua 5.4 interpreter, ~20,000 LOC) translate to clean TypeScript but exhibit runtime divergence from the original. This is a known unresolved gap.
- Significant parts of C17 are not covered. Several constructs are either unimplemented or rejected with a diagnostic rather than translated.
- Several POSIX / system-API surfaces are stubbed or partial.
- C++ source is out of scope.
- Lua source is out of scope.

When an input falls outside current coverage, the translator fails closed with a deterministic diagnostic rather than emitting broken output.

---

## Snapshot Usage

This repository is not presented as a polished npm package or maintained CLI. The commands below describe the intended shape of the prototype interface, but expect rough edges in the checked-in snapshot.

Translate a single C file:

```bash
npx c2typescript --input path/to/program.c --output path/to/program.ts
```

Translate a project tree using a compile-commands database:

```bash
npx c2typescript --project path/to/project --output path/to/out
```

Run the translated program:

```bash
node path/to/program.ts
```

### Programmatic API

```ts
import { Emitter, parseAST, mapType } from "c2typescript";

const ast = await parseAST({ source: "path/to/program.c" });
const emitter = new Emitter({ /* options */ });
const ts = emitter.emit(ast);
```

See [`UNIVERSALITY_CONTRACT.md`](UNIVERSALITY_CONTRACT.md) for the per-construct support matrix and the conditions that would have been required before making any universality claim.

---

## Design

### Specification-driven, not test-driven

C17 is a complete, published specification. The experiment enumerated coverage against ISO/IEC 9899:2018 itself rather than being driven only by accumulated test failures:

- Every C17 §6 and §7 construct is enumerated in a cell catalogue.
- Each cell is either implemented or rejected with a deterministic diagnostic; no construct is silently accepted-and-broken.
- Real-world translations confirm specification work; they do not drive it.

The resulting enumeration is partial. The intent of this approach was that, once a cell was closed, the translator should work on previously unseen code that exercises that cell - not only on the test fixtures used during development.

### Refactorable output

C2TypeScript output follows ten commitments:

1. **Correctness first.** Same observable output as the original program for inputs the translator supports.
2. **Localised bridges.** Foreign concepts emit at one-line marked sites: `// BRIDGE: <concept>`.
3. **Descriptive helper names.** `cptr_read_null_terminated_string`, not `_rnts`.
4. **Pattern consistency.** Every C pointer emits the same way; every struct-by-value emits the same way.
5. **Source identity preserved.** Identifiers, scope structure, control flow, and comments come through verbatim.
6. **Rich types.** Every parameter, return, and variable carries a precise TypeScript annotation.
7. **No clever optimisations.** One C statement maps to one TypeScript statement where possible.
8. **Explicit imports.** Every runtime helper appears as a visible `import`; the imports are the manifest of which C concepts the program uses.
9. **Documented choices.** Where translation picks one encoding among several correct options, an inline comment records the choice and the hint for refactoring.
10. **Source maps.** Each emitted TypeScript range maps back to the originating C AST node.

The output is a base layer that humans or LLMs can refactor toward idiomatic TypeScript in a separate, mechanical pass, rather than a finished idiomatic translation that has already collapsed information the refactorer would need.

### Runtime model

C2TypeScript emits to a small set of runtime libraries that model C semantics TypeScript does not natively express. These appear in the `vendor/` tree of this repository under literal names:

- `vendor/c-pointer-layout/` - the C pointer model (`CPtr` as `{buf, off}`), heap, numeric primitives, struct layout.
- `vendor/c-stdlib/` - C standard library: `printf`, `string.h`, `stdlib.h`, `math.h`, `ctype.h`, `time.h`.
- `vendor/posix-runtime/` - POSIX-shaped surfaces: VFS, environment, process, streams, clock.
- `vendor/browser-runtime/` - browser surfaces (SDL/Canvas, input, audio, storage, network) for C libraries that target the browser.

Each runtime library is its own self-contained TypeScript package. The translator emits `import` statements that reference these by descriptive name.

The repository also vendors a few translator-support libraries under similarly literal names: `clang-frontend/` (Clang AST ingestion), `source-mapping/` (translation-unit-to-output range mapping), `compile-db/` (compile-commands ingest), `dep-graph/` (dependency resolution), `conformance/` (audit and rejection diagnostics), and `validation-harness/` (parity testing).

---

## Scope

| Attribute | Status |
|---|---|
| Source language | C17 (ISO/IEC 9899:2018) - partial coverage |
| Target language | TypeScript |
| Target runtime | Node ES2022+ |
| Data model | Explicit ABI / layout declared per translation (pointer size, integer sizes, alignment, endianness) |
| C++ | Out of scope |
| Lua | Out of scope |
| Unsupported constructs | Enumerated; fail closed with deterministic diagnostics |

See [`UNIVERSALITY_CONTRACT.md`](UNIVERSALITY_CONTRACT.md) for the canonical per-attribute completion state.

---

## License

MIT - see [`LICENSE`](LICENSE). Matches the licensing of the published `ts-*` translation outputs.

## Author

Scott Moore.
