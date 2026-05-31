// EC-4: C/C++ type to TypeScript type mapper.
// Maps Clang qualType strings to TypeScript type strings.
// C17 §6.2.5: Types. C++20 §6.8: Types.

const FUNDAMENTAL_MAP: Record<string, string> = {
  "void": "void", "bool": "boolean", "_Bool": "boolean",
  // Integer types → number
  "char": "number", "signed char": "number", "unsigned char": "number",
  "short": "number", "short int": "number", "signed short": "number",
  "signed short int": "number", "unsigned short": "number", "unsigned short int": "number",
  "int": "number", "signed int": "number", "signed": "number",
  "unsigned int": "number", "unsigned": "number",
  "long": "number", "long int": "number", "signed long": "number",
  "signed long int": "number", "unsigned long": "number", "unsigned long int": "number",
  "long long": "number", "long long int": "number", "signed long long": "number",
  "signed long long int": "number", "unsigned long long": "number", "unsigned long long int": "number",
  // Fixed-width
  "int8_t": "number", "int16_t": "number", "int32_t": "number", "int64_t": "number",
  "uint8_t": "number", "uint16_t": "number", "uint32_t": "number", "uint64_t": "number",
  "size_t": "number", "ssize_t": "number", "ptrdiff_t": "number",
  "time_t": "number", "clock_t": "number", "off_t": "number", "pid_t": "number",
  "mode_t": "number", "socklen_t": "number", "wchar_t": "number",
  "char16_t": "number", "char32_t": "number",
  // Float
  "float": "number", "double": "number", "long double": "number",
  // Special
  "nullptr_t": "null", "std::nullptr_t": "null", "auto": "any",
  "FILE": "any", "va_list": "any", "jmp_buf": "any",
  // C++17/20/23 vocabulary types — PLAN.md Dimension E
  "char8_t": "number", // C++20 §6.8.2 — UTF-8 code unit
  "std::byte": "number", // C++17 §21.2.1 — byte as numeric
  "byte": "number",
  "std::format_string": "string", // C++20 §20.20
  "std::source_location": "SourceLocation", // C++20 §17.8.2
};

/**
 * Split a string on top-level commas, respecting angle-bracket `<>`, parentheses `()`
 * and square-bracket `[]` nesting. Used to parse template argument lists and
 * function-argument lists without false-splitting inside nested templates.
 */
function splitTopLevelCommas(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let last = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i]!;
    if (c === "<" || c === "(" || c === "[") depth++;
    else if (c === ">" || c === ")" || c === "]") depth--;
    else if (c === "," && depth === 0) {
      out.push(s.slice(last, i).trim());
      last = i + 1;
    }
  }
  const tail = s.slice(last).trim();
  if (tail.length > 0 || out.length > 0) out.push(tail);
  return out;
}

/**
 * Extract the contents of a `prefix<...>` template. Returns the inside of the
 * outermost `<>` if `t` starts with `prefix<` and ends with `>`, else null.
 * Handles nested angle brackets.
 */
function extractTemplateArgs(t: string, prefix: string): string | null {
  if (!t.startsWith(prefix + "<") || !t.endsWith(">")) return null;
  const inner = t.slice(prefix.length + 1, -1);
  // Verify bracket balance of the slice
  let depth = 0;
  for (const c of inner) {
    if (c === "<") depth++;
    else if (c === ">") { if (depth === 0) return null; depth--; }
  }
  return depth === 0 ? inner : null;
}

/**
 * C++20 §23 / §20.15 — unary type traits whose value-type is simply `T`
 * (references, cv-qualifiers, decay, identity are erased in TypeScript).
 */
const UNARY_TRAITS_IDENTITY = new Set([
  "remove_reference_t", "remove_const_t", "remove_volatile_t",
  "remove_cv_t", "remove_cvref_t", "decay_t",
  "add_const_t", "add_volatile_t", "add_cv_t",
  "add_lvalue_reference_t", "add_rvalue_reference_t",
  "type_identity_t", "remove_extent_t", "remove_all_extents_t",
]);

/**
 * C++20 §20.15.7.6 — unary traits that collapse to `number` (enum underlying /
 * make_signed / make_unsigned all produce integer-family types).
 */
const UNARY_TRAITS_NUMBER = new Set([
  "underlying_type_t", "make_signed_t", "make_unsigned_t",
]);

/**
 * C++20 §20.15.7 — `add_pointer_t<T>` → `T | null` (pointer-nullability model).
 */
const UNARY_TRAITS_POINTER = new Set(["add_pointer_t"]);

/** Map a C/C++ qualType string to a TypeScript type string. */
export function mapType(cppType: string): string {
  let t = cppType.trim()
    .replace(/\bstd::__cxx11::/g, "std::")
    .replace(/__gnu_cxx::/g, "");

  if (FUNDAMENTAL_MAP[t] !== undefined) return FUNDAMENTAL_MAP[t]!;

  // Normalize the pre-C++14 form `typename std::X<T>::type` → `std::X_t<T>`
  // so the unified trait dispatch below catches both spellings. C++20 §23.
  const nonTMatch = t.match(/^typename\s+std::(\w+)<(.+)>::type$/);
  if (nonTMatch) {
    return mapType(`std::${nonTMatch[1]}_t<${nonTMatch[2]}>`);
  }

  // C++20 §23 type traits — dispatched before general template handling.
  for (const trait of UNARY_TRAITS_IDENTITY) {
    const inner = extractTemplateArgs(t, `std::${trait}`);
    if (inner !== null) return mapType(inner);
  }
  for (const trait of UNARY_TRAITS_NUMBER) {
    const inner = extractTemplateArgs(t, `std::${trait}`);
    if (inner !== null) return "number";
  }
  // `std::remove_pointer_t<T*>` — strip one trailing `*` from the operand
  // before recursive mapping. C++20 §20.15.7.
  {
    const inner = extractTemplateArgs(t, "std::remove_pointer_t");
    if (inner !== null) {
      const trimmed = inner.trim();
      const stripped = trimmed.endsWith("*") ? trimmed.slice(0, -1).trim() : trimmed;
      return mapType(stripped);
    }
  }
  for (const trait of UNARY_TRAITS_POINTER) {
    const inner = extractTemplateArgs(t, `std::${trait}`);
    if (inner !== null) return `${mapType(inner)} | null`;
  }
  // `std::enable_if_t<Cond, T>` — SFINAE: when present, the type is T. §20.15.8.
  {
    const inner = extractTemplateArgs(t, "std::enable_if_t");
    if (inner !== null) {
      const args = splitTopLevelCommas(inner);
      // Two-arg form → T; one-arg form (defaults to void) → void
      if (args.length >= 2) return mapType(args[1]!);
      return "void";
    }
  }
  // `std::conditional_t<Cond, A, B>` — NOTE: Cond is not runtime-evaluable
  // from a type-string alone; we approximate with the union `A | B`. §20.15.8.
  {
    const inner = extractTemplateArgs(t, "std::conditional_t");
    if (inner !== null) {
      const args = splitTopLevelCommas(inner);
      if (args.length >= 3) return `${mapType(args[1]!)} | ${mapType(args[2]!)}`;
      return "any";
    }
  }
  // `std::common_type_t<T1, T2, ...>` — NOTE: loses the "unified common type"
  // semantic; we approximate with a union of all inputs. §20.15.7.6.
  {
    const inner = extractTemplateArgs(t, "std::common_type_t");
    if (inner !== null) {
      const args = splitTopLevelCommas(inner);
      if (args.length === 0) return "any";
      return args.map(a => mapType(a)).join(" | ");
    }
  }
  // `std::void_t<...>` → `void`. §20.15.8.
  if (extractTemplateArgs(t, "std::void_t") !== null) return "void";
  // `std::invoke_result_t<F, Args...>` — NOTE: cannot compute callee's return
  // type from a type-string; falls back to `any`. C++20 §20.15.8.
  if (extractTemplateArgs(t, "std::invoke_result_t") !== null) return "any";
  if (extractTemplateArgs(t, "std::result_of_t") !== null) return "any";

  // Strip surface-level const/volatile/restrict qualifiers. C17 §6.7.3; C++20 §9.2.9.
  // Iterate because qualifiers can appear both before and after the type
  // (`const T * const`, `T const volatile`, etc.). We preserve pointer/reference
  // tails — only top-level cv qualifiers are dropped here.
  {
    const stripped = t
      .replace(/\b(const|volatile|restrict|__restrict|__restrict__)\b/g, "")
      .replace(/\s+/g, " ")
      .replace(/\s*\*\s*/g, " * ")
      .replace(/\s*&\s*/g, " & ")
      .replace(/\s+/g, " ")
      .trim();
    if (stripped !== t && stripped.length > 0) {
      // Normalize pointer/reference spacing back to canonical form.
      const normalized = stripped
        .replace(/\s*\*\s*/g, " *")
        .replace(/\s*&\s*/g, " &")
        .replace(/\s+/g, " ")
        .trim();
      if (normalized !== t) return mapType(normalized);
    }
  }

  if (FUNDAMENTAL_MAP[t] !== undefined) return FUNDAMENTAL_MAP[t]!;

  // char pointer / array → string
  if (/^char\s*\*$/.test(t)) return "string";
  if (/^char\s*\[\d*\]$/.test(t)) return "string";

  // std::string variants
  if (t === "std::string" || t.startsWith("std::basic_string<char")) return "string";
  if (t === "std::string_view" || t.startsWith("std::basic_string_view<char")) return "string";
  if (t === "std::wstring" || t === "std::u16string" || t === "std::u32string") return "string";

  // C++20 §22.5 std::tuple<T1, T2, ...> → [T1, T2, ...]. Empty tuple → [].
  {
    const inner = extractTemplateArgs(t, "std::tuple");
    if (inner !== null) {
      const trimmed = inner.trim();
      if (trimmed === "") return "[]";
      const args = splitTopLevelCommas(trimmed);
      return `[${args.map(a => mapType(a)).join(", ")}]`;
    }
  }

  // C++20 §22.3 std::pair<T1, T2> → [T1, T2]. Document: pair and 2-tuple
  // both collapse to the same TS tuple type.
  {
    const inner = extractTemplateArgs(t, "std::pair");
    if (inner !== null) {
      const args = splitTopLevelCommas(inner);
      if (args.length === 2) return `[${mapType(args[0]!)}, ${mapType(args[1]!)}]`;
      return "[any, any]";
    }
  }

  // C++20 §22.10.17 std::function<R(Args...)> → (a0: A0, a1: A1, ...) => R.
  {
    const inner = extractTemplateArgs(t, "std::function");
    if (inner !== null) {
      const fn = parseFunctionSignature(inner);
      if (fn) return renderFunction(fn.ret, fn.args);
      return "Function";
    }
  }

  // C-style function pointer: `R (*)(Args...)` → same shape as std::function.
  {
    const m = t.match(/^(.+?)\s*\(\s*\*\s*\)\s*\((.*)\)$/);
    if (m) {
      const ret = m[1]!.trim();
      const argList = m[2]!.trim();
      const args = argList === "" || argList === "void"
        ? []
        : splitTopLevelCommas(argList);
      return renderFunction(ret, args);
    }
  }

  // STL containers
  {
    const inner = extractTemplateArgs(t, "std::vector");
    if (inner !== null) {
      // drop trailing allocator argument if present
      const args = splitTopLevelCommas(inner);
      return `${mapType(args[0]!)}[]`;
    }
  }

  // C++20 §24.3.7 std::array<T, N> → T[] (N dropped — TS arrays are dynamic).
  {
    const inner = extractTemplateArgs(t, "std::array");
    if (inner !== null) {
      const args = splitTopLevelCommas(inner);
      return `${mapType(args[0]!)}[]`;
    }
  }

  // C++20 §22.6.3 std::bitset<N> → Bitset (Alloy class reference).
  if (extractTemplateArgs(t, "std::bitset") !== null) return "Bitset";

  for (const kw of ["std::unordered_set", "std::set", "std::multiset", "std::unordered_multiset"]) {
    const inner = extractTemplateArgs(t, kw);
    if (inner !== null) {
      const args = splitTopLevelCommas(inner);
      return `Set<${mapType(args[0]!)}>`;
    }
  }

  for (const kw of ["std::unordered_map", "std::map", "std::multimap", "std::unordered_multimap"]) {
    const inner = extractTemplateArgs(t, kw);
    if (inner !== null) {
      const args = splitTopLevelCommas(inner);
      if (args.length >= 2) return `Map<${mapType(args[0]!)}, ${mapType(args[1]!)}>`;
    }
  }

  {
    const inner = extractTemplateArgs(t, "std::optional");
    if (inner !== null) {
      const mapped = mapType(inner);
      // Collapse `(T | null) | null` → `T | null`.
      if (mapped.endsWith("| null")) return mapped;
      return `${mapped} | null`;
    }
  }

  // C++20 §24.7.2 std::span<T> → T[]
  {
    const inner = extractTemplateArgs(t, "std::span");
    if (inner !== null) {
      const args = splitTopLevelCommas(inner);
      return `${mapType(args[0]!)}[]`;
    }
  }

  // C++23 §22.8 std::expected<T, E> → T | E
  {
    const inner = extractTemplateArgs(t, "std::expected");
    if (inner !== null) {
      const args = splitTopLevelCommas(inner);
      if (args.length === 2) return `${mapType(args[0]!)} | ${mapType(args[1]!)}`;
    }
  }

  // Smart pointers — C++20 §20.11.
  for (const sp of ["std::unique_ptr", "std::shared_ptr", "std::weak_ptr"]) {
    const inner = extractTemplateArgs(t, sp);
    if (inner !== null) {
      const args = splitTopLevelCommas(inner);
      const mapped = mapType(args[0]!);
      if (mapped.endsWith("| null")) return mapped;
      return `${mapped} | null`;
    }
  }

  {
    const inner = extractTemplateArgs(t, "std::atomic");
    if (inner !== null) return mapType(inner);
  }
  if (t.startsWith("std::variant<") || t === "std::any") return "any";

  // Pointer: T * → T | null
  const ptrMatch = t.match(/^(.+)\s*\*$/);
  if (ptrMatch) return `${mapType(ptrMatch[1]!)} | null`;

  // Reference: T & → T
  const refMatch = t.match(/^(.+)\s*&$/);
  if (refMatch) return mapType(refMatch[1]!);

  // struct/union/enum prefix
  const structMatch = t.match(/^(?:struct|union|enum)\s+(\w+)$/);
  if (structMatch) return structMatch[1]!;

  // Array: T[N] or T[] — C17 §6.7.6.2; C++20 §9.3.4.5. Multi-dimensional
  // handled by recursion because the innermost `[...]` is stripped first.
  const arrMatch = t.match(/^(.+)\[(\d*)\]$/);
  if (arrMatch) return `${mapType(arrMatch[1]!)}[]`;

  // Remaining pointer types
  if (t.includes("*")) return "any";

  // Clean up and use as identifier
  const cleaned = t.replace(/::/g, "_").replace(/[<>,\s*&]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
  if (!cleaned || /^\d/.test(cleaned)) return "any";
  return cleaned;
}

/**
 * Parse `R(Args...)` function-signature form used inside std::function<...>.
 * Returns { ret, args } or null if the shape doesn't match.
 */
function parseFunctionSignature(sig: string): { ret: string; args: string[] } | null {
  // Find the last top-level `(` that opens an argument list at the tail.
  let depth = 0;
  let openIdx = -1;
  for (let i = 0; i < sig.length; i++) {
    const c = sig[i]!;
    if (c === "<" || c === "(" || c === "[") {
      if (depth === 0 && c === "(") openIdx = i;
      depth++;
    } else if (c === ">" || c === ")" || c === "]") depth--;
  }
  if (openIdx < 0 || !sig.endsWith(")")) return null;
  const ret = sig.slice(0, openIdx).trim();
  const argList = sig.slice(openIdx + 1, -1).trim();
  const args = argList === "" || argList === "void"
    ? []
    : splitTopLevelCommas(argList);
  return { ret, args };
}

function renderFunction(ret: string, args: string[]): string {
  const params = args.map((a, i) => `a${i}: ${mapType(a)}`).join(", ");
  return `(${params}) => ${mapType(ret)}`;
}

/** Check if a C/C++ type is an integer type. */
export function isIntegerType(cppType: string): boolean {
  const t = cppType.replace(/\bconst\b\s*/g, "").trim();
  const intTypes = new Set([
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
    "size_t", "ssize_t", "ptrdiff_t", "bool", "_Bool",
    "wchar_t", "char16_t", "char32_t",
  ]);
  return intTypes.has(t);
}

/** Check if a C/C++ type is unsigned. */
export function isUnsignedType(cppType: string): boolean {
  const t = cppType.replace(/\bconst\b\s*/g, "").trim();
  return t.startsWith("unsigned") ||
    ["uint8_t", "uint16_t", "uint32_t", "uint64_t", "size_t"].includes(t);
}

/** Check if a C/C++ type is a float type. */
export function isFloatType(cppType: string): boolean {
  const t = cppType.replace(/\bconst\b\s*/g, "").trim();
  return t === "float";
}

/** Check if a C/C++ type is a double type. */
export function isDoubleType(cppType: string): boolean {
  const t = cppType.replace(/\bconst\b\s*/g, "").trim();
  return t === "double" || t === "long double";
}

/** Get the bit width of a C/C++ integer type (LP64 model). */
export function intBitWidth(cppType: string): number {
  const t = cppType.replace(/\bconst\b\s*/g, "").replace(/\bsigned\b\s*/g, "").replace(/\bunsigned\b\s*/g, "").trim();
  const widths: Record<string, number> = {
    "char": 8, "int8_t": 8, "uint8_t": 8,
    "short": 16, "short int": 16, "int16_t": 16, "uint16_t": 16,
    "int": 32, "int32_t": 32, "uint32_t": 32,
    "long": 64, "long int": 64,
    "long long": 64, "long long int": 64,
    "int64_t": 64, "uint64_t": 64,
    "size_t": 64, "ssize_t": 64, "ptrdiff_t": 64,
  };
  return widths[t] ?? 32;
}

/** Check if a C/C++ type is 64-bit. */
export function is64BitType(cppType: string): boolean {
  return intBitWidth(cppType) === 64 && isIntegerType(cppType);
}

/** Check if a C/C++ type is a pointer type. */
export function isPointerType(cppType: string): boolean {
  return cppType.trim().endsWith("*");
}

/** Check if a C/C++ type is a reference type. */
export function isReferenceType(cppType: string): boolean {
  return cppType.trim().endsWith("&");
}

/** Map type using bigint for 64-bit integers when enabled. */
export function mapTypeWithBigInt(cppType: string): string {
  if (is64BitType(cppType)) return "bigint";
  return mapType(cppType);
}

/** Check if a type involves long double. */
export function usesLongDouble(typeStr: string): boolean {
  return /\blong\s+double\b/.test(typeStr);
}

/** Check if a long double variable is inside a loop. */
export function isLongDoubleInLoop(typeStr: string, parentKinds: string[]): boolean {
  if (!usesLongDouble(typeStr)) return false;
  return parentKinds.some(k => ["ForStmt", "WhileStmt", "DoStmt", "CXXForRangeStmt"].includes(k));
}
