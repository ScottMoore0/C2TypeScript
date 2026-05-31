# C2TypeScript - Coverage and Universality Contract

C2TypeScript is in-progress and **does not currently meet the universality bar**. This document fixes the conditions under which it may eventually claim:

> *Universal C17 to TypeScript translator.*

The claim is valid only when every requirement below is satisfied. Until then, the project is an early-preview, partial-coverage C17 translator. Status is recorded per attribute as **Enumerated -> Implemented -> Verified -> Gated**.

## Claim scope

| Dimension | Pinned value |
|---|---|
| Source language | C17 (ISO/IEC 9899:2018) |
| Target language | TypeScript |
| Target runtime | Node ES2022+ |
| ABI / data model | Declared per translation: pointer size, integer widths, alignment, endianness |
| File / process semantics | POSIX-shaped, modelled by the `posix-runtime` library in `vendor/` |
| Unsupported constructs | Enumerated; fail closed with deterministic diagnostics |

If any of the above is unstated, the universality claim is invalid.

## Acceptance rule

C2TypeScript may claim universality only when all of the following are true:

1. Every in-scope construct is enumerated in a canonical source of truth.
2. Every enumerated construct is either fully supported or explicitly rejected.
3. Every support claim is backed by an executable test or a bounded audit.
4. Every counted fixture is wired into the active regression gate.
5. No known semantic gap remains inside the declared scope.
6. Real-world confirmation targets are completed for the declared scope.

Passing only synthetic tests is insufficient. Passing only audits is insufficient. Passing only known gates is insufficient.

None of these are fully satisfied at v0.1.

## Attributes

| ID | Attribute | Completion rule | Current state |
|---|---|---|---|
| C1 | Scope lock | Version, runtime, ABI model, and unsupported set are explicit and versioned | Enumerated |
| C2 | C AST coverage | All relevant C AST node kinds are handled or explicitly rejected | Partial |
| C3 | C17 §6 core semantic coverage | All §6 language rules are handled or rejected | Partial |
| C4 | C17 §7 standard library coverage | All in-scope library rules are handled or rejected | Partial |
| C5 | Undefined behavior boundary | All tracked UB cases are either rejected or modelled with explicit choice | Partial |
| C6 | Implementation-defined behavior | All implementation-defined decisions are fixed and documented | Partial |
| C7 | Preprocessor coverage | Macros, conditional compilation, `#include`, pragmas, `_Pragma` all handled or rejected | Partial |
| C8 | GCC/Clang extensions | Extensions in scope (`__attribute__`, `__builtin_*`, computed goto, statement expressions, `__alignof__`, `__typeof__`, etc.) enumerated and handled | Partial |
| C9 | Bridge runtime closure | All Category-2 concepts route through named, marked, consistently-applied runtime helpers (CPtr, struct-as-class, value-semantic copy, bitfield, union, manual memory, setjmp/longjmp, etc.) | Partial |
| C10 | POSIX / system API coverage | All claimed OS / process / network / thread surfaces handled or rejected | Partial |
| C11 | Multi-translation-unit ingestion | Arbitrary supported C projects ingested without manual setup | Partial |
| C12 | Cross-feature interactions | Composition of independent features (pointers + exceptions, threads + I/O, bitfields + alignment, etc.) is explicitly tested | Partial |
| C13 | Executable gate completeness | Every counted fixture is executed by CI and contributes to pass/fail | Partial |
| C14 | Real-world confirmation | Pinned real-world C projects pass end-to-end | Partial (see below) |
| C15 | Deterministic rejection behavior | All unsupported inputs fail closed with stable diagnostics | Partial |

A row reaches **Gated** only when (a) the implementation exists, (b) targeted evidence is in place, and (c) the evidence is wired into the active CI gate. No row is currently **Gated**. The universality claim cannot be made until every row above reaches **Gated**.

## Real-world confirmation matrix (C14)

| Codebase | Approx. C LOC | Translation status | Published as |
|---|---|---|---|
| cJSON | 7,000 | Round-trip parity with reference C | [ts-cJSON](https://github.com/ScottMoore0/ts-cJSON) |
| antirez/sds | 3,000 | Round-trip parity | [ts-antirez-sds](https://github.com/ScottMoore0/ts-antirez-sds) |
| tiny-aes-c | 1,000 | Round-trip parity | [ts-tiny-aes](https://github.com/ScottMoore0/ts-tiny-aes) |
| Cyan4973/xxHash | 2,000 | Round-trip parity | [ts-xxhash](https://github.com/ScottMoore0/ts-xxhash) |
| picohttpparser | 700 | Round-trip parity | [ts-picohttpparser](https://github.com/ScottMoore0/ts-picohttpparser) |
| chibi base64 | 400 | Round-trip parity | [ts-chibi-base64](https://github.com/ScottMoore0/ts-chibi-base64) |
| tiny-regex-c | 500 | Round-trip parity | [ts-tiny-regex-c](https://github.com/ScottMoore0/ts-tiny-regex-c) |
| jsmn | 500 | Round-trip parity | [ts-jsmn](https://github.com/ScottMoore0/ts-jsmn) |
| parson | 3,500 | Round-trip parity | [ts-parson](https://github.com/ScottMoore0/ts-parson) |
| FastLZ | 700 | Round-trip parity | [ts-fastlz](https://github.com/ScottMoore0/ts-fastlz) |
| Lua 5.4 interpreter (`lapi.c`, `lvm.c`, `lobject.c`, ...) | 20,000 | Translates to clean TypeScript (0 tsc errors); runtime crash in `luaH_resize` during `luaL_newstate` - under active investigation | (not yet published) |
| Various smaller crypto / hash / encoding libraries | varies | Round-trip parity | various `ScottMoore0/ts-*` repos |

The Lua 5.4 result is the largest open gap. Until it closes, the C14 row is **Partial**, not **Gated**, and no universality claim can be made.

## Canonical evidence types

C2TypeScript counts an obligation as satisfied only if it is backed by one or more of:

- Spec audit row
- Targeted matrix test
- Oracle comparison test (translated TS vs. reference C output)
- Cross-feature interaction or stress test
- Real-world confirmation target
- Deterministic-unsupported diagnostic test

Informal claims in comments or plans do not count toward completion.

## Active gate rules

The active regression gate must satisfy all of the following before universality may be claimed:

1. Every fixture counted in any scoreboard total is executed by CI.
2. Any fixture present but not executed is excluded from completion totals.
3. Oracle inventory and executed oracle inventory are reported separately.
4. Real-world confirmation targets have pinned revisions and reproducible commands.
5. The gate is invoked on every change to translator source code.

## Versioning and stability

- v1.0 ships only after every row reaches **Gated** and the Lua 5.4 interpreter runs without crashes.
- Per the Translator Output Charter, every release maintains observable behavior parity on the published real-world corpus.
- Breaking changes to the public TypeScript API surface require a major version bump.
- Output format changes (new BRIDGE marker kinds, new runtime helper signatures) require a minor version bump and a changelog entry describing the refactorability impact.

## Out of scope

| Source language | Status |
|---|---|
| C++20 | Out of scope for C2TypeScript |
| Lua 5.4 (Lua scripts as source) | Out of scope for C2TypeScript |

C2TypeScript does not silently accept non-C input. C++ and Lua source files fail with a deterministic diagnostic.
