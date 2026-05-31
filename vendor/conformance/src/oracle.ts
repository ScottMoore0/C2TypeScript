// SC-1: Oracle — run original and translated programs, compare output.

import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  timedOut: boolean;
}

export interface CompareResult {
  match: boolean;
  originalOutput: string;
  translatedOutput: string;
  diff: string[];
}

/** Run a command and capture its output. */
export async function runProgram(
  command: string,
  args: string[] = [],
  opts?: { timeout?: number; cwd?: string; env?: Record<string, string> }
): Promise<RunResult> {
  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      timeout: opts?.timeout ?? 10000,
      cwd: opts?.cwd,
      env: { ...process.env, ...opts?.env },
      maxBuffer: 10 * 1024 * 1024,
    });
    return { stdout, stderr, exitCode: 0, timedOut: false };
  } catch (e: any) {
    if (e.killed) return { stdout: e.stdout ?? "", stderr: e.stderr ?? "", exitCode: -1, timedOut: true };
    return { stdout: e.stdout ?? "", stderr: e.stderr ?? "", exitCode: e.code ?? 1, timedOut: false };
  }
}

/** Compare two program outputs line by line. */
export function compareOutput(original: string, translated: string): CompareResult {
  const origLines = original.split("\n");
  const transLines = translated.split("\n");
  const diff: string[] = [];

  const maxLen = Math.max(origLines.length, transLines.length);
  for (let i = 0; i < maxLen; i++) {
    const a = origLines[i] ?? "";
    const b = transLines[i] ?? "";
    if (a !== b) {
      diff.push(`line ${i + 1}: expected '${a}' got '${b}'`);
    }
  }

  return {
    match: diff.length === 0,
    originalOutput: original,
    translatedOutput: translated,
    diff
  };
}

/** Compare with float tolerance for numeric outputs. */
export function compareOutputWithTolerance(
  original: string,
  translated: string,
  tolerance: number = 1e-6
): CompareResult {
  const origLines = original.split("\n");
  const transLines = translated.split("\n");
  const diff: string[] = [];

  const maxLen = Math.max(origLines.length, transLines.length);
  for (let i = 0; i < maxLen; i++) {
    const a = origLines[i] ?? "";
    const b = transLines[i] ?? "";
    if (a === b) continue;

    // Try numeric comparison with tolerance.
    const na = parseFloat(a);
    const nb = parseFloat(b);
    if (!isNaN(na) && !isNaN(nb) && Math.abs(na - nb) < tolerance) continue;

    diff.push(`line ${i + 1}: expected '${a}' got '${b}'`);
  }

  return {
    match: diff.length === 0,
    originalOutput: original,
    translatedOutput: translated,
    diff
  };
}
