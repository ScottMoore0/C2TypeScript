// FC-13: C compatibility headers.
// iso646.h (C17 §7.9), stdbool.h (C17 §7.18), stdalign.h (C17 §7.15),
// stdnoreturn.h (C17 §7.23)
//
// These headers define macros/types that map to TS equivalents:
// - iso646.h: and/or/not etc. → handled by Clang preprocessing
// - stdbool.h: bool/true/false → TS boolean
// - stdalign.h: alignas/alignof → no TS equivalent
// - stdnoreturn.h: noreturn → TS never

// iso646.h alternative operator tokens — these are preprocessor macros
// that Clang resolves before AST generation, so nothing to emit.
// Listed here for completeness:
// and (&&), or (||), not (!), and_eq (&=), or_eq (|=),
// not_eq (!=), xor (^), xor_eq (^=), bitand (&), bitor (|), compl (~)

/** stdbool.h: true/false are TS built-ins. */
export const c_true = true;
export const c_false = false;

/** stdnoreturn.h: _Noreturn → TS never (annotation only). */
// No runtime implementation needed — this is a type annotation.
