// CD-12: Output format stability.
//
// Rules (binding):
//   - Alphabetical key ordering for all nested objects
//   - 2-space indentation
//   - LF line endings (JSON.stringify produces "\n" natively)
//   - Trailing newline on the emitted string
//   - Array order is preserved (callers are responsible for ordering arrays
//     according to their domain-specific rules, e.g. includes in command-line
//     order, macros alphabetically by name, headers alphabetically by path)

export function canonicalJsonStringify(value: unknown): string {
  const sorted = sortKeysDeep(value);
  return JSON.stringify(sorted, null, 2) + "\n";
}

function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sortKeysDeep(item));
  }
  if (value !== null && typeof value === "object") {
    const input = value as Record<string, unknown>;
    const sortedKeys = Object.keys(input).sort();
    const output: Record<string, unknown> = {};
    for (const key of sortedKeys) {
      output[key] = sortKeysDeep(input[key]);
    }
    return output;
  }
  return value;
}

// Round-trip helper: returns a canonical-form clone with keys sorted but
// values otherwise untouched. Useful for programmatic consumers that want
// the canonical object without the string serialisation cost.
export function canonicalize<T>(value: T): T {
  return sortKeysDeep(value) as T;
}
