// AUTO-GENERATED — C17 §7.2 assert
// Regenerate with: npx tsx compiler/scripts/build-catalogue/generate-forge-trivials.ts
// Generated: 2026-04-22T00:07:28.456Z

/**
 * C17 §7.2.1.1: assert — runtime assertion. If NDEBUG is set at translation
 * time the translator should emit a no-op; otherwise it emits a call to this
 * runtime helper.
 *
 * BRIDGE: libc-assert
 * Refactor target: console.assert(cond, msg) or throw AssertionError
 */
export function c_assert(condition: unknown, message: string = ""): void {
  if (!condition) {
    throw new Error(`Assertion failed${message ? ": " + message : ""}`);
  }
}

/**
 * C11 §7.2.2: static_assert — compile-time assertion. At TS emission time this
 * typically collapses to a comment or a TypeScript type-level check; this
 * runtime helper exists only for cases where the translator couldn't prove
 * the condition at translate-time.
 */
export function c_static_assert(condition: unknown, message: string = ""): void {
  if (!condition) {
    throw new Error(`static_assert failed${message ? ": " + message : ""}`);
  }
}