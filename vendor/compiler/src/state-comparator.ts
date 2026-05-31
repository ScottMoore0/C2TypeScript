/**
 * Game state comparator for non-textual output programs.
 * Instead of comparing stdout, compares internal program state
 * (variable values, function return values) via trace instrumentation.
 *
 * For graphical programs like games, the "output" is pixels — which
 * can't be compared as text. Instead we compare execution traces:
 * if every function returns the same value in both versions,
 * the programs are behaviorally equivalent.
 */

import { captureTrace, TraceEntry } from "./trace-capture.js";
import { diffTraces, TraceDivergence, findAllDivergences } from "./trace-diff.js";

export interface StateComparison {
  match: boolean;
  totalTraceEntries: number;
  divergences: TraceDivergence[];
  firstDivergence: TraceDivergence | null;
}

/**
 * Compare two program executions by their function-level traces.
 * Both programs must have been instrumented with trace calls.
 *
 * @param originalCmd Command to run the original (e.g., "./stratagus --headless")
 * @param originalArgs Arguments for the original
 * @param tsCmd Command to run the TypeScript version
 * @param tsArgs Arguments for the TS version
 * @param options Execution options
 */
export function compareByTrace(
  originalCmd: string,
  originalArgs: string[],
  tsCmd: string,
  tsArgs: string[],
  options?: { timeout?: number; stdin?: string; maxDivergences?: number }
): StateComparison {
  const timeout = options?.timeout ?? 30000;

  const cppResult = captureTrace(originalCmd, originalArgs, { timeout, stdin: options?.stdin });
  const tsResult = captureTrace(tsCmd, tsArgs, { timeout, stdin: options?.stdin });

  const firstDiv = diffTraces(cppResult.trace, tsResult.trace);
  const allDivs = firstDiv
    ? findAllDivergences(cppResult.trace, tsResult.trace, options?.maxDivergences ?? 50)
    : [];

  return {
    match: firstDiv === null,
    totalTraceEntries: Math.max(cppResult.trace.length, tsResult.trace.length),
    divergences: allDivs,
    firstDivergence: firstDiv,
  };
}

/**
 * Compare two pre-captured traces (for when you already have the traces).
 */
export function compareTraces(
  cppTrace: TraceEntry[],
  tsTrace: TraceEntry[]
): StateComparison {
  const firstDiv = diffTraces(cppTrace, tsTrace);
  const allDivs = firstDiv ? findAllDivergences(cppTrace, tsTrace, 50) : [];

  return {
    match: firstDiv === null,
    totalTraceEntries: Math.max(cppTrace.length, tsTrace.length),
    divergences: allDivs,
    firstDivergence: firstDiv,
  };
}

/**
 * For games: generate a headless test script that exercises game logic
 * without requiring rendering, and captures game state as trace output.
 *
 * Returns a Lua script (for Stratagus-like games) or a command-line
 * flag string (for CLI-mode games).
 */
export function generateHeadlessTestScript(
  registeredLuaBindings: string[],
  frameCount: number = 100
): string {
  const lines = [
    "-- Auto-generated headless test script",
    "-- Exercises game logic and captures state",
    "",
  ];

  // Call each registered binding with simple test args
  for (const fn of registeredLuaBindings.slice(0, 50)) {
    lines.push(`pcall(function() ${fn}(1, "test") end)`);
  }

  // Advance game frames
  lines.push("");
  lines.push(`for i = 1, ${frameCount} do`);
  lines.push(`  -- GameCycle would advance one frame`);
  lines.push(`  pcall(function() GameCycle(1) end)`);
  lines.push(`end`);

  return lines.join("\n");
}
