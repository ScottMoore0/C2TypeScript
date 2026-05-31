// SN-4: Advanced output comparators.
// C17 testing infrastructure — compare program outputs beyond simple string matching.

/** Result of a comparison operation. */
export interface ComparisonResult {
  matches: boolean;
  mode: string;
  details?: string;
  firstDiffLine?: number;
  firstDiffExpected?: string;
  firstDiffActual?: string;
}

/** Compare two strings exactly. */
export function compareExact(expected: string, actual: string): ComparisonResult {
  if (expected === actual) return { matches: true, mode: "exact" };
  // Find first differing line
  const expLines = expected.split("\n");
  const actLines = actual.split("\n");
  for (let i = 0; i < Math.max(expLines.length, actLines.length); i++) {
    if (expLines[i] !== actLines[i]) {
      return {
        matches: false, mode: "exact",
        firstDiffLine: i + 1,
        firstDiffExpected: expLines[i] ?? "(missing)",
        firstDiffActual: actLines[i] ?? "(missing)",
      };
    }
  }
  return { matches: true, mode: "exact" };
}

/** Compare with normalized whitespace. */
export function compareNormalized(expected: string, actual: string): ComparisonResult {
  const norm = (s: string) => s.replace(/\r\n/g, "\n").replace(/\s+$/gm, "").trim();
  return compareExact(norm(expected), norm(actual));
}

/** Compare binary output (byte-level diff). */
export function compareBinary(expected: Uint8Array, actual: Uint8Array): ComparisonResult {
  if (expected.length !== actual.length) {
    return {
      matches: false, mode: "binary",
      details: `Length mismatch: expected ${expected.length} bytes, got ${actual.length}`,
    };
  }
  for (let i = 0; i < expected.length; i++) {
    if (expected[i] !== actual[i]) {
      return {
        matches: false, mode: "binary",
        details: `Byte ${i}: expected 0x${expected[i]!.toString(16).padStart(2, "0")}, got 0x${actual[i]!.toString(16).padStart(2, "0")}`,
      };
    }
  }
  return { matches: true, mode: "binary" };
}

/** Compare exit codes. */
export function compareExitCode(expected: number, actual: number): ComparisonResult {
  return {
    matches: expected === actual,
    mode: "exit-code",
    details: expected !== actual ? `Expected exit code ${expected}, got ${actual}` : undefined,
  };
}

/** Compare stderr output. */
export function compareStderr(expected: string, actual: string): ComparisonResult {
  const result = compareNormalized(expected, actual);
  return { ...result, mode: "stderr" };
}

/** Compare with floating-point tolerance. */
export function compareFloatTolerance(
  expected: string,
  actual: string,
  tolerance: number = 1e-6,
): ComparisonResult {
  const expLines = expected.split("\n");
  const actLines = actual.split("\n");
  if (expLines.length !== actLines.length) {
    return { matches: false, mode: "float-tolerance", details: `Line count mismatch: ${expLines.length} vs ${actLines.length}` };
  }
  for (let i = 0; i < expLines.length; i++) {
    const eTok = expLines[i]!.split(/\s+/);
    const aTok = actLines[i]!.split(/\s+/);
    if (eTok.length !== aTok.length) {
      return { matches: false, mode: "float-tolerance", firstDiffLine: i + 1, firstDiffExpected: expLines[i], firstDiffActual: actLines[i] };
    }
    for (let j = 0; j < eTok.length; j++) {
      const eNum = parseFloat(eTok[j]!);
      const aNum = parseFloat(aTok[j]!);
      if (!isNaN(eNum) && !isNaN(aNum)) {
        if (Math.abs(eNum - aNum) > tolerance) {
          return { matches: false, mode: "float-tolerance", firstDiffLine: i + 1, details: `Token ${j}: ${eTok[j]} vs ${aTok[j]} (diff ${Math.abs(eNum - aNum)})` };
        }
      } else if (eTok[j] !== aTok[j]) {
        return { matches: false, mode: "float-tolerance", firstDiffLine: i + 1, firstDiffExpected: expLines[i], firstDiffActual: actLines[i] };
      }
    }
  }
  return { matches: true, mode: "float-tolerance" };
}

/** Detect performance regression (wall-clock time). */
export function comparePerformance(
  baselineMs: number,
  actualMs: number,
  regressionThreshold: number = 2.0,
): ComparisonResult {
  const ratio = actualMs / (baselineMs || 1);
  return {
    matches: ratio <= regressionThreshold,
    mode: "performance",
    details: `${actualMs.toFixed(0)}ms vs baseline ${baselineMs.toFixed(0)}ms (${ratio.toFixed(1)}x)`,
  };
}

/** Compare unordered lines (set comparison). */
export function compareUnorderedLines(expected: string, actual: string): ComparisonResult {
  const expSet = new Set(expected.split("\n").map(l => l.trim()).filter(l => l));
  const actSet = new Set(actual.split("\n").map(l => l.trim()).filter(l => l));
  const missing = [...expSet].filter(l => !actSet.has(l));
  const extra = [...actSet].filter(l => !expSet.has(l));
  if (missing.length === 0 && extra.length === 0) {
    return { matches: true, mode: "unordered-lines" };
  }
  return {
    matches: false, mode: "unordered-lines",
    details: `Missing: ${missing.length}, Extra: ${extra.length}. First missing: ${missing[0] ?? "none"}`,
  };
}
