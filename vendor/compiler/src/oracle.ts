/**
 * Phase 8.3-8.5: Comparison oracle.
 * Runs both original and translated versions, compares output.
 */

import { spawnSync } from "node:child_process";

export interface Divergence {
  type: "exit_code" | "stdout" | "stderr" | "file_output";
  expected: string;
  actual: string;
  details?: string;
}

export interface OracleResult {
  match: boolean;
  divergences: Divergence[];
  cppExitCode: number;
  tsExitCode: number;
  cppStdout: string;
  tsStdout: string;
}

export function compare(
  originalExe: string,
  tsFile: string,
  options?: { stdin?: string; timeout?: number; cwd?: string }
): OracleResult {
  const timeout = options?.timeout ?? 10000;
  const divergences: Divergence[] = [];

  // Run original
  const cppResult = spawnSync(originalExe, [], {
    timeout, encoding: "utf-8", input: options?.stdin,
  });
  const cppExitCode = ((cppResult.status ?? 1) % 256 + 256) % 256;
  const cppStdout = (cppResult.stdout ?? "").replace(/\r\n/g, "\n");
  const cppStderr = (cppResult.stderr ?? "").replace(/\r\n/g, "\n");

  // Run TypeScript
  const tsResult = spawnSync("npx", ["tsx", tsFile], {
    timeout, encoding: "utf-8", input: options?.stdin,
    cwd: options?.cwd, shell: true,
  });
  const tsExitCode = ((tsResult.status ?? 1) % 256 + 256) % 256;
  const tsStdout = (tsResult.stdout ?? "").replace(/\r\n/g, "\n");

  // Compare exit codes
  if (cppExitCode !== tsExitCode) {
    divergences.push({
      type: "exit_code",
      expected: String(cppExitCode),
      actual: String(tsExitCode),
    });
  }

  // Compare stdout
  if (cppStdout !== tsStdout) {
    divergences.push({
      type: "stdout",
      expected: cppStdout,
      actual: tsStdout,
      details: `Expected ${cppStdout.length} bytes, got ${tsStdout.length} bytes`,
    });
  }

  return {
    match: divergences.length === 0,
    divergences,
    cppExitCode,
    tsExitCode,
    cppStdout,
    tsStdout,
  };
}
