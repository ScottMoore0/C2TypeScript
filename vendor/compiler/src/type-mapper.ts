/**
 * Maps C++ type strings (from Clang's qualType) to TypeScript types.
 * Used by the emitter to produce typed output.
 */

/**
 * Map a C++ qualType string to a TypeScript type string.
 * Handles fundamental types, pointers, references, const, and common std types.
 */
const anonTypeCache = new Map<string, string>();
function fnv1a32Hex(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}
function normalizeAnonymousTypes(input: string): string {
  // C17 §6.7.2.1 / C++20 §9.2.8.2: Clang's TypePrinter emits anonymous
  // struct/union/enum types as one of:
  //   struct (unnamed at <file>:<line>:<col>)
  //   struct (unnamed struct at <file>:<line>:<col>)
  //   union  (anonymous at <file>:<line>:<col>)
  //   union  (anonymous union at <file>:<line>:<col>)
  //   enum   (anonymous enum at <file>:<line>:<col>)
  //   struct (anonymous <empty> at <file>:<line>:<col>)
  // and may also appear qualified: `Outer::(anonymous struct at ...)`,
  // `struct Ns::Outer::(unnamed at ...)` etc. The regex below permits
  // flexible whitespace and the optional outer `(struct|union|enum) `
  // keyword; the replacement always maps the (kind, location) pair to a
  // stable FNV-1a-hashed identifier — deterministic across TUs since the
  // cache key is a pure function of kind + file + line + col.
  const primary = /(?:\b(struct|union|enum)\s+)?\(\s*(anonymous|unnamed)(?:\s+(struct|union|enum|<empty>))?\s+at\s+([^)]+)\)/g;
  let out = input.replace(primary, (_m, outerKind, _which, innerKind, loc) => {
    const kind = innerKind && innerKind !== "<empty>" ? innerKind : (outerKind ?? "record");
    return resolveAnonIdentifier(kind, loc);
  });
  // Defence-in-depth: if a previous regex (e.g. an earlier `fnMatch` pass)
  // stripped the enclosing parens, we may still see bare `unnamed at …:L:C`
  // or `anonymous at …:L:C` substrings. Catch them too so `/` and `:` never
  // reach the sanitiser-bypass fallback paths. Location is terminated by
  // whitespace, `*`, `&`, `,`, `;`, `)`, `]`, `}` or end-of-string.
  // Location pattern: any run of non-delimiter chars that ends with
  // `:<digits>:<digits>` — matches `path.c:123:45` and `C:/x/y.h:1:1`
  // without swallowing trailing operators or identifiers.
  const bare = /\b(?:(struct|union|enum)\s+)?(anonymous|unnamed)(?:\s+(struct|union|enum|<empty>))?\s+at\s+([^\s*&,;()[\]{}]*?:\d+:\d+)/g;
  out = out.replace(bare, (_m, outerKind, _which, innerKind, loc) => {
    const kind = innerKind && innerKind !== "<empty>" ? innerKind : (outerKind ?? "record");
    return resolveAnonIdentifier(kind, loc);
  });
  return out;
}

function resolveAnonIdentifier(kind: string, loc: string): string {
  // Normalise backslashes (Windows paths) so the same anonymous type produces
  // one identifier regardless of how the AST emitter quoted the file path.
  const normLoc = loc.replace(/\\/g, "/").trim();
  const key = `${kind}::${normLoc}`;
  let cached = anonTypeCache.get(key);
  if (cached === undefined) {
    cached = `anon_${kind}_${fnv1a32Hex(key)}`;
    anonTypeCache.set(key, cached);
  }
  return cached;
}

export function mapType(cppType: string): string {
  // Strip leading/trailing whitespace
  let t = cppType.trim();

  // Strip GCC/Clang internal namespace prefixes before matching
  t = t.replace(/\bstd::__cxx11::/g, "std::");
  t = t.replace(/__gnu_cxx::/g, "");

  // C17 §6.7.2.1 / C++20 §9.2.8.2: normalise Clang's anonymous-type print
  // forms (`(anonymous struct at ...)` / `(unnamed struct at ...)`) into
  // stable mangled identifiers BEFORE any other regex runs.
  t = normalizeAnonymousTypes(t);

  // C23 §6.7.2.5 / §6.7.2.6: `typeof(expr-or-type)` and `typeof_unqual(expr-or-type)`
  // are type-specifiers whose denoted type is the inner expression/type. The
  // _unqual form additionally strips top-level cv-qualifiers (and _Atomic).
  // Clang's qualType prints them with the spelled form (`typeof(const int)`,
  // `typeof_unqual(const int)`), and provides the resolved form in
  // `desugaredQualType`; the emitter passes both at various sites. To keep
  // type-mapping correct regardless of which field reaches us, strip the
  // wrapping syntactic form here and recurse on the inner type.
  const typeofMatch = t.match(/^typeof(_unqual)?\s*\(\s*(.+)\s*\)$/);
  if (typeofMatch) {
    let inner = typeofMatch[2].trim();
    // C23 §6.7.2.6: typeof_unqual additionally drops top-level cv-qualifiers
    // and _Atomic. Strip those before recursion so the unqualified form maps.
    if (typeofMatch[1] === "_unqual") {
      inner = inner.replace(/\b(const|volatile|restrict|_Atomic)\b/g, "").trim();
    }
    return mapType(inner);
  }

  // C23 §7.20: `_Decimal32`, `_Decimal64`, `_Decimal128` IEEE 754-2008
  // decimal floating-point types. JS has no native decimal-float type;
  // we surface as `number` so value flow continues, but the emitter
  // raises a `[c23-decimal-floating-point]` diagnostic at the source-scan
  // stage (no IEEE 754-2008 binary-decimal conversion in JS).
  // BRIDGE: c23-decimal-fp — IEEE 754-2008 decimal float surfaced as JS double; precision divergence is unavoidable until a TC39 Decimal proposal lands.
  if (t === "_Decimal32" || t === "_Decimal64" || t === "_Decimal128") {
    return "number";
  }

  // C23 §6.2.5/6 + §6.7.2.1: bit-precise integer types `_BitInt(N)` and
  // `unsigned _BitInt(N)`. Clang surfaces them as qualType strings of the form
  // `_BitInt(N)` or `unsigned _BitInt(N)`. Width N is programmer-specified
  // (clang supports up to 8388608). We map small widths (N ≤ 32) to JS
  // `number` (JS bitwise ops give exact 32-bit semantics), and wider widths
  // (N > 32) to `bigint` (Number's 53-bit mantissa would silently lose bits
  // on a 64-bit shift or wide multiply). The signedness is encoded in the
  // mask/wrap helper applied at each operation site, not in the type alias.
  // BRIDGE: c23-bitint — bit-precise integer; widths > 32 surfaced as bigint.
  const bitIntMatch = t.match(/^(?:unsigned\s+)?_BitInt\(\s*(\d+)\s*\)$/);
  if (bitIntMatch) {
    const width = parseInt(bitIntMatch[1], 10);
    return width <= 32 ? "number" : "bigint";
  }

  // Fundamental types
  const fundamentalMap: Record<string, string> = {
    "void": "void",
    "bool": "boolean",
    "_Bool": "boolean",

    // Integer types → number
    "char": "number",
    "signed char": "number",
    "unsigned char": "number",
    "short": "number",
    "short int": "number",
    "signed short": "number",
    "signed short int": "number",
    "unsigned short": "number",
    "unsigned short int": "number",
    "int": "number",
    "signed int": "number",
    "signed": "number",
    "unsigned int": "number",
    "unsigned": "number",
    "long": "number",
    "long int": "number",
    "signed long": "number",
    "signed long int": "number",
    "unsigned long": "number",
    "unsigned long int": "number",
    "long long": "number",
    "long long int": "number",
    "signed long long": "number",
    "signed long long int": "number",
    "unsigned long long": "number",
    "unsigned long long int": "number",

    // Fixed-width integers
    "int8_t": "number",
    "int16_t": "number",
    "int32_t": "number",
    "int64_t": "number",
    "uint8_t": "number",
    "uint16_t": "number",
    "uint32_t": "number",
    "uint64_t": "number",
    "size_t": "number",
    "ssize_t": "number",
    "ptrdiff_t": "number",
    "off_t": "number",
    "pid_t": "number",
    // zlib (zconf.h) primitive aliases — `typedef unsigned char Byte`,
    // `typedef unsigned int uInt`, `typedef unsigned long uLong`, plus
    // their `Bytef`/`uIntf`/`uLongf` "FAR-pointer" historical variants
    // (FAR is empty on modern targets). Many libpng/zlib-backed libs
    // emit `Byte buf[N]` initializers that need this to map to
    // `number[]` (and not `(typeof Byte !== 'undefined' ? new Byte() : ...)`).
    "Byte": "number",
    "Bytef": "number",
    "uInt": "number",
    "uIntf": "number",
    "uLong": "number",
    "uLongf": "number",
    "uShortf": "number",
    "uShort": "number",
    "z_off_t": "number",
    "z_off64_t": "number",
    "z_size_t": "number",
    "z_crc_t": "number",
    "mode_t": "number",
    "uid_t": "number",
    "gid_t": "number",
    "time_t": "number",
    "clock_t": "number",
    // MSVC <time.h> sized aliases — implementation-named per C17 §7.27.1.
    "__time32_t": "number",
    "__time64_t": "number",
    // <time.h> struct tag — full struct would carry MSVC internals; map to
    // `any` so user-facing fields (tm_year, tm_mon, …) typecheck without
    // pulling in the system-internal definition.
    "tm": "any",
    "struct tm": "any",
    // MSVC <errno.h> typedef (C11 Annex K). Public-facing return type for
    // *_s variants — never emit the system-header decl; map to number.
    "errno_t": "number",
    "socklen_t": "number",
    "in_addr_t": "number",
    "in_port_t": "number",
    "nfds_t": "number",
    "dev_t": "number",
    "ino_t": "number",
    "nlink_t": "number",
    "blksize_t": "number",
    "blkcnt_t": "number",
    "key_t": "number",
    "id_t": "number",
    "suseconds_t": "number",
    "useconds_t": "number",
    "rlim_t": "number",
    "cc_t": "number",
    "speed_t": "number",
    "tcflag_t": "number",
    "wint_t": "number",
    "wchar_t": "number",
    "char8_t": "number",
    "char16_t": "number",
    "char32_t": "number",
    "sig_atomic_t": "number",
    "intmax_t": "number",
    "uintmax_t": "number",
    "intptr_t": "number",
    "uintptr_t": "number",

    // C99 §7.20.1.3 — "Fastest minimum-width" integer types. The compiler
    // is free to choose any width ≥ N that's fastest on the target; we
    // map them all to the JS `number` domain (BigInt for 64-bit), the
    // same as the corresponding fixed-width int_t/uint_t entries.
    "int_fast8_t": "number",
    "int_fast16_t": "number",
    "int_fast32_t": "number",
    "int_fast64_t": "number",
    "uint_fast8_t": "number",
    "uint_fast16_t": "number",
    "uint_fast32_t": "number",
    "uint_fast64_t": "number",
    // C99 §7.20.1.2 — "Minimum-width" integer types. Same routing.
    "int_least8_t": "number",
    "int_least16_t": "number",
    "int_least32_t": "number",
    "int_least64_t": "number",
    "uint_least8_t": "number",
    "uint_least16_t": "number",
    "uint_least32_t": "number",
    "uint_least64_t": "number",

    // Float types → number
    "float": "number",
    "double": "number",
    "long double": "number", // NOTE: precision loss — C++ long double is 80-bit, JS number is 64-bit IEEE 754

    // _Complex types (C99)
    "_Complex float": "any",
    "_Complex double": "any",
    "_Complex long double": "any",
    "float _Complex": "any",
    "double _Complex": "any",
    "complex float": "any",
    "complex double": "any",

    // Special
    "nullptr_t": "null",
    "std::nullptr_t": "null",
    "auto": "any",

    // POSIX/system opaque types → any
    "va_list": "any",
    "__builtin_va_list": "any",
    "__gnuc_va_list": "any",
    "__va_list_tag": "any",
    "_locale_t": "any",
    "_LocaleNameInfo": "any",
    "_threadlocaleinfo": "any",
    "_threadmbcinfo": "any",
    "pthreadlocinfo": "any",
    "pthreadmbcinfo": "any",
    "_pthreadlocinfo": "any",
    "_pthreadmbcinfo": "any",
    "threadlocinfo": "any",
    "threadmbcinfo": "any",
    "localeinfo_struct": "any",
    "_locale_tstruct": "any",
    "jmp_buf": "any",
    "sigjmp_buf": "any",
    "sigset_t": "any",
    "pthread_t": "any",
    "pthread_mutex_t": "any",
    "pthread_cond_t": "any",
    "pthread_attr_t": "any",
    "sem_t": "any",
    "DIR": "any",
    "FILE": "any",
    "regex_t": "any",
    "regmatch_t": "any",
    "pthread_rwlock_t": "any",
    "pthread_rwlockattr_t": "any",
    "pthread_barrier_t": "any",
    "pthread_barrierattr_t": "any",
    "pthread_spinlock_t": "any",
    "pthread_key_t": "any",
    "pthread_mutexattr_t": "any",
    "pthread_condattr_t": "any",
    "glob_t": "any",
    "iconv_t": "any",
    "mbstate_t": "any",
    "fpos_t": "any",
    "div_t": "any",
    "ldiv_t": "any",
    "lldiv_t": "any",
    "imaxdiv_t": "any",
    "struct_tm": "any",

    // R-SIMD-2: Intel SSE vector types (xmmintrin.h / emmintrin.h).
    //
    // Spec: Intel Intrinsics Guide. The translator lowers `_mm_*` SSE
    // intrinsics to per-lane scalar JS expressions over 4-element arrays,
    // so the `__m128` family declares as `number[]` (or
    // `Float32Array | Int32Array`) at the type level.
    //
    // BRIDGE: sse-vector-type — 128-bit SIMD register surfaced as a
    // 4-element JS array. Refactorers can re-encode to `Float32Array(4)`,
    // `Int32Array(4)`, `Float64Array(2)`, or to native JS SIMD / WebAssembly
    // v128 by replacing every `__m128*` declaration site and every
    // `BRIDGE: sse-*` emit site in concert.
    "__m128": "number[]",
    "__m128_u": "number[]",
    "__m128d": "number[]",
    "__m128d_u": "number[]",
    "__m128i": "number[]",
    "__m128i_u": "number[]",
    "__m64": "number[]",
    "__v4sf": "number[]",
    "__v2df": "number[]",
    "__v4si": "number[]",
    "__v2di": "number[]",
    "__v8hi": "number[]",
    "__v16qi": "number[]",

    // R-SIMD-6: Intel AVX/AVX2 vector types (avxintrin.h / avx2intrin.h).
    // Spec: Intel Intrinsics Guide. The translator lowers `_mm256_*` AVX/AVX2
    // intrinsics to per-lane scalar JS expressions over 8-element (f32 / i32)
    // or 4-element (f64) arrays, so the `__m256` family declares as `number[]`.
    // BRIDGE: avx-vector-type — 256-bit SIMD register surfaced as a JS array
    // (8-lane f32, 4-lane f64, or 8-lane i32). Refactorers can re-encode to
    // `Float32Array(8)`, `Float64Array(4)`, `Int32Array(8)`, or to native JS
    // SIMD / WebAssembly v128×2 by replacing every `__m256*` declaration
    // site and every `BRIDGE: avx-*` / `BRIDGE: avx2-*` emit site in concert.
    "__m256": "number[]",
    "__m256_u": "number[]",
    "__m256d": "number[]",
    "__m256d_u": "number[]",
    "__m256i": "number[]",
    "__m256i_u": "number[]",
    "__v8sf": "number[]",
    "__v4df": "number[]",
    "__v8si": "number[]",
    "__v4di": "number[]",
    "__v16hi": "number[]",
    "__v32qi": "number[]",
    "__v8su": "number[]",
    "__v4du": "number[]",

    // R-SIMD-7: Intel AVX-512 vector types (avx512fintrin.h and friends).
    // Spec: Intel Intrinsics Guide. The translator lowers `_mm512_*` AVX-512
    // intrinsics to per-lane scalar JS expressions over 16-element (f32 / i32)
    // or 8-element (f64 / i64) arrays, so the `__m512` family declares as
    // `number[]`. JS lacks native 512-bit SIMD; refactorers can re-encode to
    // `Float32Array(16)`, `Float64Array(8)`, `Int32Array(16)`, or to a
    // WebAssembly v128×4 batch by replacing every `__m512*` declaration site
    // and every `BRIDGE: avx512-*` emit site in concert. Mask register types
    // (`__mmask8`, `__mmask16`, `__mmask32`, `__mmask64`) lower to plain
    // numbers (or BigInt for `__mmask64`) carrying the bit pattern.
    // BRIDGE: avx512-vector-type — 512-bit SIMD register surfaced as JS array.
    "__m512": "number[]",
    "__m512_u": "number[]",
    "__m512d": "number[]",
    "__m512d_u": "number[]",
    "__m512i": "number[]",
    "__m512i_u": "number[]",
    "__v16sf": "number[]",
    "__v8df":  "number[]",
    "__v16si": "number[]",
    "__v8di":  "number[]",
    "__v32hi": "number[]",
    "__v64qi": "number[]",
    "__v16su": "number[]",
    "__v8du":  "number[]",
    // AVX-512 mask registers — bit-vector predicates. We surface them as
    // `number` (16/32-bit-safe) since JS bitwise ops are 32-bit. `__mmask64`
    // would require BigInt routing for full 64-bit fidelity; for now we
    // alias to `number` and rely on the lowering to keep masks within
    // 32-bit precision (sufficient for the curated subset).
    "__mmask8":  "number",
    "__mmask16": "number",
    "__mmask32": "number",
    "__mmask64": "number",

    // Lua types → any
    "lua_State": "any",

    // Redis types → string
    "sds": "string",
  };

  // Direct match
  if (fundamentalMap[t] !== undefined) {
    return fundamentalMap[t];
  }

  // Remove const/volatile/restrict/_Atomic qualifiers for matching.
  // C17 §6.7.3 / C++20 §9.2.9.4 [dcl.type.cv]: cv-qualifiers are erased at
  // the value-category boundary. TypeScript has no const/volatile surface,
  // so strip them before lookup. Without `volatile`-stripping, a struct
  // field declared `volatile size_t refcount` falls through to
  // mangleTypeToIdentifier and emits `volatile_size_t` — an undefined
  // identifier (jansson's json_t.refcount).
  const withoutConst = t.replace(/\b(const|volatile|restrict|_Atomic)\b\s*/g, "").replace(/\s+/g, " ").trim();
  if (fundamentalMap[withoutConst] !== undefined) {
    return fundamentalMap[withoutConst];
  }
  // C++20 §9.2.9.4 [dcl.type.cv]: top-level const/volatile is dropped at the
  // value-category boundary (parameter type adjustment: §9.2.3.5 [dcl.fct] p5,
  // template-arg deduction: §13.10.3.5 [temp.deduct.type] p3). TypeScript has
  // no const-qualifier surface, so re-enter mapType with const stripped so
  // downstream library-type checks (std::string, std::vector<...>, std::map,
  // etc.) match the unqualified canonical form. Without this, a parameter
  // declared `const std::string&` arrives as `const std::string` after the
  // reference-strip below and falls all the way through to the
  // mangleTypeToIdentifier fallback as `const_std_string`.
  if (withoutConst !== t) {
    return mapType(withoutConst);
  }

  // Pointer to char → string (common C string pattern)
  if (t === "const char *" || t === "char *" || t === "const char*" || t === "char*") {
    return "string";
  }

  // Char array → string (C string buffer: char name[64])
  if (/^(?:const\s+)?char\s*\[\d*\]$/.test(t)) {
    return "string";
  }

  // Lambda types → Function
  if (t.startsWith("(lambda") || t.includes("lambda at")) {
    return "Function";
  }

  // C17 §6.7.6.1 / §6.7.6.2: pointer-to-pointer (T**) is a single pointer
  // object whose pointee is itself a pointer. In our runtime, T** is encoded
  // as a slot-bearing CPtr (see self-modifying-loop's cptr_read_ptr /
  // cptr_write_ptr helpers — Option A). Terminate the recursion at one level
  // of `**` so we don't emit `(T | null) | null`, which would otherwise be
  // produced by recursing through the single-pointer rule.
  const ptrPtrMatch = t.match(/^(.+?)\s*\*\s*\*$/);
  if (ptrPtrMatch) {
    return "CPtr | null";
  }
  // Generic pointer: T * → T | null. C17 §6.2.5/6.3.2.3: `void *` is the
  // generic pointer type — an opaque address that may point to anything.
  // Mapping the inner `void` literally produces `void | null` which TS
  // strict mode rejects in truthiness checks (`if (!ptr)` against
  // `void | null` raises TS1345). Use `any | null` for void * so the
  // pointer behaves as a generic-address slot.
  const ptrMatch = t.match(/^(.+)\s*\*$/);
  if (ptrMatch) {
    const innerStripped = ptrMatch[1].replace(/\b(const|volatile|restrict)\b/g, "").trim();
    if (innerStripped === "void") return "any | null";
    // Byte-pointer types (uint8_t*, unsigned char*, signed char*, int8_t*,
    // user typedefs that resolve to those) are typically CPtr-style buffers
    // in C; emitting `number | null` causes TS1345/TS2322 cascade when the
    // body accesses `.buf` / `.off` (monocypher load24_le, ed25519-donna,
    // and similar crypto byte-pointer code).
    if (innerStripped === "uint8_t" || innerStripped === "int8_t" ||
        innerStripped === "u8" || innerStripped === "i8" ||
        innerStripped === "byte" || innerStripped === "BYTE" ||
        innerStripped === "unsigned char" || innerStripped === "signed char") {
      return "any | null";
    }
    // Wider integral-pointer types (`int *`, `unsigned int *`, `short *`,
    // `long *`, `size_t *`, plus their u/signed variants) behave like
    // byte pointers downstream: the emitter routes subscripts/derefs
    // through `cptr_read_*` / `__struct_ptr_at` (CPtr-shaped), but call
    // sites may pass plain JS arrays (`new Array(N).fill(0)`) or a box.
    // Type as `any | null` so both shapes typecheck without losing the
    // null-pointer case.
    const integralPrim = /^(?:(?:un)?signed\s+)?(?:short(?:\s+int)?|int|long(?:\s+long)?(?:\s+int)?|size_t|ssize_t|ptrdiff_t|intmax_t|uintmax_t|u?int(?:16|32|64)_t|s?intptr_t|uintptr_t|u(?:16|32|64)|i(?:16|32|64))$/;
    if (integralPrim.test(innerStripped)) {
      return "any | null";
    }
    const inner = mapType(ptrMatch[1]);
    return `${inner} | null`;
  }

  // Reference: T & → T
  const refMatch = t.match(/^(.+)\s*&$/);
  if (refMatch) {
    return mapType(refMatch[1]);
  }

  // std::string and string variants
  if (t === "std::string" || t === "std::basic_string<char>" || t.startsWith("std::basic_string<char,")) {
    return "string";
  }
  if (t === "std::string_view" || t === "std::basic_string_view<char>" || t.startsWith("std::basic_string_view<char,")) {
    return "string";
  }
  if (t === "std::wstring" || t === "std::basic_string<wchar_t>" || t.startsWith("std::basic_string<wchar_t,")) {
    return "string";
  }
  if (t === "std::u16string" || t === "std::u32string") {
    return "string";
  }
  // basic_string_view without std:: prefix (GCC internal)
  if (t === "basic_string_view" || t.startsWith("basic_string_view<")) {
    return "string";
  }

  // std::vector<T>
  const vecMatch = t.match(/^std::vector<(.+?)(?:,\s*std::allocator<.+?>)?\s*>$/);
  if (vecMatch) {
    return `${mapType(vecMatch[1])}[]`;
  }

  // std::array<T, N> → T[]
  const arrayMatch = t.match(/^std::array<(.+?),\s*\d+\s*>$/);
  if (arrayMatch) {
    return `${mapType(arrayMatch[1])}[]`;
  }

  // std::deque<T> → T[]
  const dequeMatch = t.match(/^std::deque<(.+?)(?:,\s*std::allocator<.+?>)?\s*>$/);
  if (dequeMatch) {
    return `${mapType(dequeMatch[1])}[]`;
  }

  // std::list<T> → T[]
  const listMatch = t.match(/^std::list<(.+?)(?:,\s*std::allocator<.+?>)?\s*>$/);
  if (listMatch) {
    return `${mapType(listMatch[1])}[]`;
  }

  // std::forward_list<T> → T[]
  const flistMatch = t.match(/^std::forward_list<(.+?)(?:,\s*std::allocator<.+?>)?\s*>$/);
  if (flistMatch) {
    return `${mapType(flistMatch[1])}[]`;
  }

  // std::span<T> → T[]
  const spanMatch = t.match(/^std::span<(.+?)(?:,\s*\d+)?\s*>$/);
  if (spanMatch) {
    return `${mapType(spanMatch[1])}[]`;
  }

  // std::set<T> → Set<T>
  const setMatch = t.match(/^std::(?:unordered_)?set<(.+?)(?:,\s*std::\w+<.+?>)*\s*>$/);
  if (setMatch) {
    return `Set<${mapType(setMatch[1])}>`;
  }

  // std::map<K,V> → Map<K,V>  (already partially handled in cleanup)
  const mapMatch = t.match(/^std::map<(.+?),\s*(.+?)(?:,\s*std::\w+<.+?>)*\s*>$/);
  if (mapMatch) {
    return `Map<${mapType(mapMatch[1])}, ${mapType(mapMatch[2])}>`;
  }

  // std::unordered_map<K,V> → Map<K,V>
  const umapMatch = t.match(/^std::unordered_map<(.+?),\s*(.+?)(?:,\s*std::\w+<.+?>)*\s*>$/);
  if (umapMatch) {
    return `Map<${mapType(umapMatch[1])}, ${mapType(umapMatch[2])}>`;
  }

  // std::pair<A,B> → [any, any]
  if (t.startsWith("std::pair<")) {
    return "[any, any]";
  }

  // std::tuple<...> → any[]
  if (t.startsWith("std::tuple<")) {
    return "any[]";
  }

  // std::queue<T>, std::priority_queue<T>, std::stack<T> → any[]
  if (t.startsWith("std::queue<") || t.startsWith("std::priority_queue<") || t.startsWith("std::stack<")) {
    return "any[]";
  }

  // std::function<...> → Function
  if (t.startsWith("std::function<")) {
    return "Function";
  }

  // std::variant<...> → any
  if (t.startsWith("std::variant<")) {
    return "any";
  }

  // std::any → any
  if (t === "std::any") {
    return "any";
  }

  // std::optional<T> → T | null
  if (t.startsWith("std::optional<")) {
    const innerMatch = t.match(/^std::optional<(.+?)>$/);
    if (innerMatch) {
      return `${mapType(innerMatch[1])} | null`;
    }
    return "any";
  }
  if (t === "std::optional") return "any";

  // C++23 types
  if (t.startsWith("std::expected<")) return "any";
  if (t.startsWith("std::mdspan<")) return "any";
  if (t.startsWith("std::generator<")) return "any";
  if (t === "std::expected" || t === "std::mdspan" || t === "std::generator") return "any";

  // std::bitset<N> → number
  if (t.startsWith("std::bitset<")) {
    return "number";
  }

  // std::complex<T> → any
  if (t.startsWith("std::complex<")) {
    return "any";
  }

  // std::atomic<T> → number (typically wraps numeric types)
  const atomicMatch = t.match(/^std::atomic<(.+?)>$/);
  if (atomicMatch) {
    return mapType(atomicMatch[1]);
  }

  // std::chrono types
  if (t === "std::chrono::seconds" || t === "std::chrono::milliseconds" ||
      t === "std::chrono::microseconds" || t === "std::chrono::nanoseconds" ||
      t === "std::chrono::minutes" || t === "std::chrono::hours" ||
      t === "std::chrono::duration" || t.startsWith("std::chrono::duration<")) {
    return "number";
  }
  if (t === "std::chrono::time_point" || t.startsWith("std::chrono::time_point<")) {
    return "number";
  }
  if (t === "std::chrono::steady_clock" || t === "std::chrono::system_clock" ||
      t === "std::chrono::high_resolution_clock") {
    return "any";
  }

  // std::mutex, std::recursive_mutex, std::condition_variable → any
  if (t === "std::mutex" || t === "std::recursive_mutex" || t === "std::condition_variable") {
    return "any";
  }

  // std::thread → any
  if (t === "std::thread") {
    return "any";
  }

  // std::promise<T>, std::future<T> → Promise<any>
  if (t.startsWith("std::promise<") || t.startsWith("std::future<")) {
    return "Promise<any>";
  }

  // Function pointer: T (*) (params) → strip the (*) so the function-type
  // regex below sees a plain `T (params)` shape. C function-pointer
  // qualTypes from Clang carry the pointer-decorator parens explicitly
  // (`void *(*)(size_t)`); without this strip the greedy `.+` in the
  // function-type regex grabs the wrong paren group and emits a curried
  // signature like `(arg0: number) => (arg0: any) => void` (mini-gmp
  // mp_set_memory_functions, ~30 occurrences).
  const fnPtrStripped = t.replace(/\s*\(\s*\*\s*\)\s*/, " ").replace(/\s+/g, " ").trim();
  // Function type: T (params...) → (params) => T
  const fnMatch = fnPtrStripped.match(/^(.+)\s*\(([^)]*)\)$/);
  if (fnMatch) {
    const retType = mapType(fnMatch[1]);
    const params = fnMatch[2]
      ? fnMatch[2].split(",").map((p, i) => `arg${i}: ${mapType(p.trim())}`).join(", ")
      : "";
    return `(${params}) => ${retType}`;
  }

  // C struct/union/enum prefix: "struct Point" → "Point"
  const structMatch = t.match(/^(?:struct|union|enum)\s+(\w+)$/);
  if (structMatch) {
    return structMatch[1];
  }

  // User-defined template type: Foo<int, double> → Foo (strip template args)
  const templateMatch = t.match(/^([A-Za-z_]\w*)\s*<.*>$/);
  if (templateMatch) {
    return templateMatch[1];
  }

  // C++ const pointer types: "const CUnit *const" → "any"
  if (t.includes("*") && t.includes("const")) return "any";

  // C++ const reference types: "const CUnit &" → mapped inner type
  const constRefMatch = t.match(/^const\s+(\w+)\s*&$/);
  if (constRefMatch) return mapType(constRefMatch[1]);

  // C++ smart pointer types: "std::unique_ptr<X>" → "any"
  if (t.includes("unique_ptr") || t.includes("shared_ptr") || t.includes("weak_ptr")) return "any";

  // C++ array of smart pointers: "std::vector<std::unique_ptr<X>>" → "any[]"
  if (t.includes("vector<") && t.includes("unique_ptr")) return "any[]";

  // Any remaining type with [] suffix (C++ array type leaked through)
  const arrayTypeMatch = t.match(/^(.+)\[(\d*)\]$/);
  if (arrayTypeMatch) {
    const inner = mapType(arrayTypeMatch[1]);
    return `${inner}[]`;
  }

  // Any remaining type with * (pointer): just use "any"
  if (t.includes("*")) return "any";

  // Fallback: strip C++ syntax and produce a valid TS identifier.
  // Spec reference: ECMA-262 §12.6 IdentifierName = IdentifierStart IdentifierPart*
  // where (for ASCII) IdentifierStart ∈ [A-Za-z_$] and IdentifierPart ∈ [A-Za-z0-9_$].
  // To keep output stable and easily diffable we restrict to [A-Za-z0-9_] and
  // replace anything else with `_`. This is a positive match so any character
  // that Clang's TypePrinter can emit (operators, brackets, punctuation, NTTP
  // literals like `"foo"` / `'x'`, lambda mangling glyphs `$`, `@`, `#`,
  // requires-clause `:` and `=`, Unicode identifier chars, etc.) is handled.
  const mangled = mangleTypeToIdentifier(t);
  return mangled;
}

// ---------------------------------------------------------------------------
// Template / complex-type identifier mangling
// ---------------------------------------------------------------------------

/**
 * Collapse any run of characters that are not TS-identifier-safe to a single
 * underscore. "Safe" here is [A-Za-z0-9_]. Leading/trailing underscores are
 * stripped. Empty results collapse to the empty string (caller decides
 * fallback). This is a pure function — no cache, no collision detection.
 */
export function sanitizeToIdentifier(s: string): string {
  // Positive match: any char not in [A-Za-z0-9_] → underscore.
  const replaced = s.replace(/[^A-Za-z0-9_]/g, "_");
  // Preserve already-valid identifiers verbatim. Collapsing runs of `_` to a
  // single `_` and stripping leading/trailing `_` are needed only when the
  // sanitisation step injected underscores. Without this guard, valid C
  // identifiers like `__mpz_struct` (mini-gmp) and `stbi__write_context`
  // (stb_image_write) get corrupted to `mpz_struct` / `stbi_write_context`,
  // and downstream `type X = ${mapped}` aliases reference identifiers that
  // no longer exist in the emitted TS.
  if (replaced === s && /^[A-Za-z_][A-Za-z0-9_]*$/.test(s)) return s;
  const collapsed = replaced.replace(/_+/g, "_").replace(/^_|_$/g, "");
  return collapsed;
}

/**
 * 32-bit FNV-1a over the UTF-16 code units of `s`. Deterministic, stable
 * across runs, and good enough to disambiguate distinct qualType strings that
 * happen to collapse to the same sanitised prefix (e.g. `Foo<1+2>` vs
 * `Foo<1-2>` both → `Foo_1_2`). Returned as a lowercase 8-char hex string.
 */
export function fnv1a8(s: string): string {
  let h = 0x811c9dc5 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i) & 0xff;
    // 32-bit FNV prime multiply: h *= 16777619 (mod 2^32).
    h = Math.imul(h, 0x01000193) >>> 0;
    // Mix the high byte of the code unit too, so that multi-byte characters
    // (template NTTP string literals, Unicode identifiers) contribute fully.
    const hi = (s.charCodeAt(i) >>> 8) & 0xff;
    if (hi) {
      h ^= hi;
      h = Math.imul(h, 0x01000193) >>> 0;
    }
  }
  return h.toString(16).padStart(8, "0");
}

// Module-level cache: sanitised identifier → original qualType string that
// first produced it. If a later qualType collapses to the same identifier we
// detect collision and append `_<fnv1a8>` to disambiguate.
const _manglerCache = new Map<string, string>();

/**
 * Map an arbitrary C++ qualType string to a valid TypeScript identifier.
 *
 * Guarantees:
 *   1. Result matches /^[A-Za-z_][A-Za-z0-9_]*$/
 *   2. Deterministic: same input always produces same output within a run.
 *   3. Injective w.r.t. original qualType: two distinct qualType strings never
 *      produce the same identifier (collision → `_<fnv1a8>` suffix).
 *
 * Empty / digit-leading inputs collapse to the literal `any` (preserving the
 * prior behaviour of `mapType`'s fallback).
 */
export function mangleTypeToIdentifier(cppType: string): string {
  const original = cppType;
  // Normalise `::` to `_` first so namespace separators do not become a
  // single underscore run with adjacent punctuation and lose readability.
  const preColon = original.replace(/::/g, "_");
  const pretty = sanitizeToIdentifier(preColon);

  // Empty or starts with digit: fall through to `any` (callers upstream may
  // prefer a specific sentinel — `any` is preserved for back-compat).
  if (!pretty || /^[0-9]/.test(pretty)) return "any";

  const cached = _manglerCache.get(pretty);
  if (cached === undefined) {
    _manglerCache.set(pretty, original);
    return pretty;
  }
  if (cached === original) {
    return pretty;
  }
  // Collision: two distinct qualType strings mangled to the same prefix.
  // Append the FNV-1a hash of the original to disambiguate. Re-cache the
  // hashed form separately so subsequent hits of the same qualType are stable.
  const withHash = `${pretty}_${fnv1a8(original)}`;
  const hashedCached = _manglerCache.get(withHash);
  if (hashedCached === undefined) {
    _manglerCache.set(withHash, original);
  }
  return withHash;
}

/**
 * Test-only: reset the mangler cache. Exported so the matrix/oracle harnesses
 * can guarantee determinism across back-to-back runs that would otherwise
 * share module state.
 */
export function _resetManglerCache(): void {
  _manglerCache.clear();
}

/**
 * Check if a C++ type is a float (single-precision) type needing Math.fround.
 */
export function isFloatType(cppType: string): boolean {
  const t = cppType.replace(/\bconst\b\s*/g, "").trim();
  return t === "float" || t === "float _Complex";
}

/**
 * Check if a C++ type is an integer type that needs overflow wrapping.
 */
export function isIntegerType(cppType: string): boolean {
  const t = cppType.replace(/\bconst\b\s*/g, "").trim();
  const intTypes = [
    "char", "signed char", "unsigned char",
    "short", "short int", "signed short", "signed short int",
    "unsigned short", "unsigned short int",
    "int", "signed int", "signed", "unsigned int", "unsigned",
    "long", "long int", "signed long", "signed long int",
    "unsigned long", "unsigned long int",
    "long long", "long long int", "signed long long", "signed long long int",
    "unsigned long long", "unsigned long long int",
    "int8_t", "int16_t", "int32_t", "int64_t",
    "uint8_t", "uint16_t", "uint32_t", "uint64_t",
    "size_t", "ssize_t", "ptrdiff_t",
    "bool", "_Bool",
    "wchar_t", "char16_t", "char32_t",
  ];
  if (intTypes.includes(t)) return true;
  // C23 §6.2.5/6: `_BitInt(N)` and `unsigned _BitInt(N)` are integer types.
  if (isBitIntType(t)) return true;
  return false;
}

/**
 * C23 §6.2.5/6 + §6.7.2.1: detect `_BitInt(N)` / `unsigned _BitInt(N)` types.
 * Accepts arbitrary cv-qualifier prefixes by first stripping `const`.
 */
export function isBitIntType(cppType: string): boolean {
  const t = cppType.replace(/\b(const|volatile|restrict)\b\s*/g, "").trim();
  return /^(?:unsigned\s+)?_BitInt\(\s*\d+\s*\)$/.test(t);
}

/**
 * C23 §6.2.5/6: extract the bit width N from a `_BitInt(N)` /
 * `unsigned _BitInt(N)` type string. Returns null if the input is not a
 * bit-precise integer type.
 */
export function bitIntWidth(cppType: string): number | null {
  const t = cppType.replace(/\b(const|volatile|restrict)\b\s*/g, "").trim();
  const m = t.match(/^(?:unsigned\s+)?_BitInt\(\s*(\d+)\s*\)$/);
  return m ? parseInt(m[1], 10) : null;
}

/**
 * C23 §6.2.5/6: a `_BitInt(N)` value should be carried as JS `bigint` when
 * its width exceeds 32 bits — JS Number's 53-bit mantissa cannot hold a
 * faithful 64-bit shift product, and the spec demands modular arithmetic at
 * exactly N bits. For N ≤ 32 we stay in Number and apply mask/sign-extension
 * at each op site (matches `i32/u32/| 0/>>> 0` patterns already in use for
 * the standard 8/16/32-bit integer types).
 */
export function bitIntUsesBigInt(cppType: string): boolean {
  const w = bitIntWidth(cppType);
  return w !== null && w > 32;
}

/**
 * Check if a C++ type is unsigned.
 */
export function isUnsignedType(cppType: string): boolean {
  const t = cppType.replace(/\bconst\b\s*/g, "").trim();
  // C23 §6.2.5/6: `unsigned _BitInt(N)` is unsigned; bare `_BitInt(N)` is signed.
  // Both forms start with `_BitInt(` after the optional `unsigned ` prefix, so
  // the prefix-check below catches `unsigned _BitInt(N)` correctly.
  return t.startsWith("unsigned") ||
    t === "uint8_t" || t === "uint16_t" || t === "uint32_t" || t === "uint64_t" ||
    t === "size_t";
}

/**
 * Get the bit width of a C++ integer type (LP64 model).
 */
export function intBitWidth(cppType: string): number {
  const t = cppType.replace(/\bconst\b\s*/g, "").replace(/\bsigned\b\s*/g, "").replace(/\bunsigned\b\s*/g, "").trim();
  // Platform-dependent: Windows LLP64 has long==32 bits; Unix LP64 has
  // long==64. Match `process.platform` so emitted Math.imul/i32/u32 wraps
  // are applied at the right width and FNV/PRNG/loop-product test
  // arithmetic matches the C reference's actual overflow behaviour.
  const longWidth = process.platform === "win32" ? 32 : 64;
  const widths: Record<string, number> = {
    "char": 8,
    "int8_t": 8, "uint8_t": 8,
    "short": 16, "short int": 16,
    "int16_t": 16, "uint16_t": 16,
    "int": 32, "int32_t": 32, "uint32_t": 32,
    "long": longWidth, "long int": longWidth,
    "long long": 64, "long long int": 64,
    "int64_t": 64, "uint64_t": 64,
    "size_t": 64, "ssize_t": 64, "ptrdiff_t": 64,
  };
  return widths[t] ?? 32;
}

/**
 * Check if a C++ type is a 64-bit integer that should use BigInt.
 */
export function is64BitType(cppType: string): boolean {
  return intBitWidth(cppType) === 64 && isIntegerType(cppType);
}

/**
 * Map a C++ type to TS, using bigint for 64-bit integers when enabled.
 */
export function mapTypeWithBigInt(cppType: string): string {
  if (is64BitType(cppType)) return "bigint";
  return mapType(cppType);
}

// For precision-critical long double usage, decimal.js can be used:
// import { Decimal } from 'decimal.js';
// Operations: new Decimal(val).add(other), .mul(), .div(), .sqrt(), .toString()
export const DECIMAL_OPERATIONS: Record<string, string> = {
  '+': '.add',
  '-': '.sub',
  '*': '.mul',
  '/': '.div',
  'sqrt': '.sqrt',
  'abs': '.abs',
  'floor': '.floor',
  'ceil': '.ceil',
  'pow': '.pow',
  'log': '.ln',
  'exp': '.exp',
};

/**
 * Check if a C++ type involves `long double`.
 * Used by the oracle to widen float tolerance since long double (80-bit)
 * loses precision when mapped to JS number (64-bit IEEE 754).
 */
export function usesLongDouble(typeStr: string): boolean {
  return /\blong\s+double\b/.test(typeStr);
}

/**
 * Check if a long double variable is inside a loop construct.
 * When long double is used in a loop, accumulated floating-point error
 * can be significant — consider using Decimal.js for precision.
 */
export function isLongDoubleInLoop(typeStr: string, parentKinds: string[]): boolean {
  if (!usesLongDouble(typeStr)) return false;
  return parentKinds.some(k => ['ForStmt', 'WhileStmt', 'DoStmt', 'CXXForRangeStmt'].includes(k));
}

/**
 * Check if a C/C++ type is a complex number type (C99 _Complex).
 */
export function isComplexType(t: string): boolean {
  return /\b_Complex\b|\bcomplex\b/i.test(t) && /\b(float|double|long)\b/.test(t);
}
