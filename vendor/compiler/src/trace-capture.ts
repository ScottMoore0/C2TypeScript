/**
 * Phase 9.5: Trace capture engine.
 * Runs an instrumented program and captures execution traces from stderr.
 */

import { spawnSync } from "node:child_process";

export interface TraceEntry {
  type: "enter" | "exit" | "assign" | "branch";
  func: string;
  args?: string[];
  value?: string;
  line?: number;
}

/**
 * Parse a trace line into a structured entry.
 * Format: >func arg1 arg2  (enter)
 *         <func retval     (exit)
 *         =var value        (assign)
 *         ?line true/false  (branch)
 */
export function parseTraceLine(line: string): TraceEntry | null {
  if (!line || line.length < 2) return null;
  const prefix = line[0];
  const rest = line.slice(1).trim();

  switch (prefix) {
    case ">": {
      const parts = rest.split(" ");
      return { type: "enter", func: parts[0], args: parts.slice(1) };
    }
    case "<": {
      const parts = rest.split(" ");
      return { type: "exit", func: parts[0], value: parts[1] };
    }
    case "=": {
      const parts = rest.split(" ", 2);
      return { type: "assign", func: parts[0], value: parts[1] };
    }
    case "?": {
      const parts = rest.split(" ", 2);
      return { type: "branch", func: "", line: parseInt(parts[0]), value: parts[1] };
    }
    default:
      return null;
  }
}

/**
 * Run a program and capture its trace output from stderr.
 */
export function captureTrace(
  command: string,
  args: string[],
  options?: { stdin?: string; timeout?: number; cwd?: string }
): { exitCode: number; stdout: string; trace: TraceEntry[] } {
  const result = spawnSync(command, args, {
    timeout: options?.timeout ?? 10000,
    encoding: "utf-8",
    input: options?.stdin,
    cwd: options?.cwd,
    shell: process.platform === "win32",
  });

  const exitCode = result.status ?? 1;
  const stdout = (result.stdout ?? "").replace(/\r\n/g, "\n");
  const stderr = (result.stderr ?? "").replace(/\r\n/g, "\n");

  const trace: TraceEntry[] = [];
  for (const line of stderr.split("\n")) {
    const entry = parseTraceLine(line);
    if (entry) trace.push(entry);
  }

  return { exitCode, stdout, trace };
}
