// FC-9: C assert macro.
// C17 §7.2: Diagnostics.

/** C17 §7.2: assert — abort if condition is false. */
export function c_assert(condition: unknown, expr?: string): void {
  if (!condition) {
    const msg = expr ? `Assertion failed: ${expr}` : "Assertion failed";
    process.stderr.write(msg + "\n");
    process.exit(134); // SIGABRT
  }
}
