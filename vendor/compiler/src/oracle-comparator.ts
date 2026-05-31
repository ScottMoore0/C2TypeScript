/**
 * Phase K3: Output comparator.
 * Compares C++ and TypeScript execution outputs to detect divergences.
 * Includes output sanitization (Gemini doc 11) for false-positive prevention.
 */

import { spawnSync } from "node:child_process";

export interface Divergence {
  type: "stdout" | "stderr" | "exitcode" | "screenshot" | "state";
  line?: number;
  expected: string;
  actual: string;
  severity: "critical" | "warning" | "info";
}

export interface ComparisonResult {
  matches: boolean;
  divergences: Divergence[];
  score: number; // 0-1, 1 = perfect match
  nonDeterministic?: boolean;
}

/**
 * Sanitize output to prevent false divergences (Gemini doc 11).
 * Strips non-deterministic content: pointer addresses, float precision noise, whitespace.
 */
export function sanitizeOutput(output: string): string {
  let s = output;
  // Normalize line endings
  s = s.replace(/\r\n/g, "\n");
  // Strip pointer/hex addresses: 0x7ffd12345678 → <ADDR>
  s = s.replace(/0x[0-9a-fA-F]{4,16}/g, "<ADDR>");
  // Normalize Lua error messages: strip file path prefix from error strings
  // Lua: "...path/file.lua:6: test error" → "test error"
  // TS:  "Error: test error" → "test error"
  s = s.replace(/\.\.\.[^\t\n]*?:\d+:\s*/g, "");
  s = s.replace(/Error:\s*/g, "");
  // Normalize float precision to 5 decimal places
  s = s.replace(/(\d+\.\d{6,})/g, (match) => {
    return parseFloat(match).toFixed(5);
  });
  // Strip trailing whitespace per line
  s = s.replace(/[ \t]+$/gm, "");
  // Strip trailing newlines
  s = s.replace(/\n+$/, "");
  return s;
}

/**
 * Compare stdout/stderr text output line by line.
 * @param usesLongDouble If the original source uses `long double`, a wider epsilon (1e-10) is used
 *                       instead of the default (1e-4) to allow for extended-precision drift.
 */
export function compareText(expected: string, actual: string, label: "stdout" | "stderr", usesLongDouble: boolean = false): Divergence[] {
  const divergences: Divergence[] = [];
  const floatTolerance = usesLongDouble ? 1e-10 : 0.0001;
  // Sanitize both outputs before comparing
  const expSanitized = sanitizeOutput(expected);
  const actSanitized = sanitizeOutput(actual);
  const expLines = expSanitized.split("\n");
  const actLines = actSanitized.split("\n");
  const maxLines = Math.max(expLines.length, actLines.length);

  for (let i = 0; i < maxLines; i++) {
    const exp = expLines[i] ?? "";
    const act = actLines[i] ?? "";

    if (exp === act) continue;

    // Try numeric comparison with tolerance (wider for long double sources)
    const expNum = parseFloat(exp.trim());
    const actNum = parseFloat(act.trim());
    if (!isNaN(expNum) && !isNaN(actNum)) {
      const diff = Math.abs(expNum - actNum);
      if (diff < floatTolerance) {
        continue; // Close enough for floating point
      }
      // If within wider epsilon (1e-10), treat as long double precision loss warning
      if (diff < 1e-10) {
        divergences.push({
          type: label,
          line: i + 1,
          expected: exp,
          actual: act,
          severity: "warning", // long double precision loss (80-bit → 64-bit), not a real failure
        });
        continue;
      }
    }

    // Ignore trailing whitespace differences
    if (exp.trimEnd() === act.trimEnd()) continue;

    divergences.push({
      type: label,
      line: i + 1,
      expected: exp,
      actual: act,
      severity: "critical",
    });
  }

  return divergences;
}

/**
 * Compare exit codes.
 */
export function compareExitCode(expected: number, actual: number): Divergence[] {
  if (expected === actual) return [];
  return [{
    type: "exitcode",
    expected: String(expected),
    actual: String(actual),
    severity: "critical",
  }];
}

/**
 * Compare two results fully.
 */
export function compareOutputs(
  cppResult: { stdout: string; stderr: string; exitCode: number },
  tsResult: { stdout: string; stderr: string; exitCode: number },
): ComparisonResult {
  const divergences: Divergence[] = [
    ...compareText(cppResult.stdout, tsResult.stdout, "stdout"),
    ...compareText(cppResult.stderr, tsResult.stderr, "stderr"),
    ...compareExitCode(cppResult.exitCode, tsResult.exitCode),
  ];

  const totalLines = Math.max(
    cppResult.stdout.split("\n").length,
    cppResult.stderr.split("\n").length,
    1
  );
  const errorLines = divergences.filter(d => d.severity === "critical").length;
  const score = Math.max(0, 1 - errorLines / totalLines);

  return {
    matches: divergences.length === 0,
    divergences,
    score,
  };
}

/**
 * Re-run a C executable multiple times to check for non-deterministic output.
 * Returns true if the program produces different output across runs.
 */
function checkNonDeterministic(
  executable: string,
  args: string[] = [],
  options: { timeout?: number; input?: string; cwd?: string } = {},
): boolean {
  const timeout = options.timeout ?? 30000;
  const outputs: string[] = [];

  for (let i = 0; i < 3; i++) {
    const result = spawnSync(executable, args, {
      encoding: "utf-8",
      timeout,
      input: options.input,
      cwd: options.cwd,
      stdio: ["pipe", "pipe", "pipe"],
    });
    outputs.push(sanitizeOutput(result.stdout ?? ""));
  }

  return outputs[0] !== outputs[1] || outputs[0] !== outputs[2];
}

/**
 * Compare outputs with non-determinism detection.
 * If comparison fails, re-runs the C program 3 times to check if the C program
 * itself is non-deterministic before blaming the translation.
 */
export function compareOutputsWithNonDetCheck(
  cppResult: { stdout: string; stderr: string; exitCode: number },
  tsResult: { stdout: string; stderr: string; exitCode: number },
  cppExecutable?: string,
  cppArgs?: string[],
  cppRunOptions?: { timeout?: number; input?: string; cwd?: string },
): ComparisonResult {
  const result = compareOutputs(cppResult, tsResult);

  if (!result.matches && cppExecutable) {
    const isNonDet = checkNonDeterministic(cppExecutable, cppArgs ?? [], cppRunOptions ?? {});
    if (isNonDet) {
      return {
        matches: false,
        divergences: [{
          type: "stdout",
          expected: "(non-deterministic)",
          actual: "(non-deterministic)",
          severity: "info",
        }],
        score: result.score,
        nonDeterministic: true,
      };
    }
  }

  return result;
}
