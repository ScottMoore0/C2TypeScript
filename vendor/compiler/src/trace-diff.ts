/**
 * Phase 9.6: Trace diff engine.
 * Compares two execution traces and finds the first divergence.
 */

import type { TraceEntry } from "./trace-capture.js";

export interface TraceDivergence {
  traceIndex: number;
  cppEntry: TraceEntry | null;
  tsEntry: TraceEntry | null;
  type: "value_mismatch" | "missing_in_ts" | "extra_in_ts" | "function_mismatch";
  description: string;
}

/**
 * Compare two traces line by line. Return the first divergence, or null if identical.
 */
export function diffTraces(
  cppTrace: TraceEntry[],
  tsTrace: TraceEntry[]
): TraceDivergence | null {
  const maxLen = Math.max(cppTrace.length, tsTrace.length);

  for (let i = 0; i < maxLen; i++) {
    const cpp = i < cppTrace.length ? cppTrace[i] : null;
    const ts = i < tsTrace.length ? tsTrace[i] : null;

    if (!cpp && ts) {
      return {
        traceIndex: i,
        cppEntry: null,
        tsEntry: ts,
        type: "extra_in_ts",
        description: `TS has extra trace at index ${i}: ${ts.type} ${ts.func}`,
      };
    }

    if (cpp && !ts) {
      return {
        traceIndex: i,
        cppEntry: cpp,
        tsEntry: null,
        type: "missing_in_ts",
        description: `TS trace ended early at index ${i}. C++ has: ${cpp.type} ${cpp.func}`,
      };
    }

    if (cpp && ts) {
      // Check type match
      if (cpp.type !== ts.type) {
        return {
          traceIndex: i,
          cppEntry: cpp,
          tsEntry: ts,
          type: "function_mismatch",
          description: `Trace type mismatch at ${i}: C++ ${cpp.type} vs TS ${ts.type}`,
        };
      }

      // Check function name match (for enter/exit)
      if ((cpp.type === "enter" || cpp.type === "exit") && cpp.func !== ts.func) {
        return {
          traceIndex: i,
          cppEntry: cpp,
          tsEntry: ts,
          type: "function_mismatch",
          description: `Function mismatch at ${i}: C++ ${cpp.func} vs TS ${ts.func}`,
        };
      }

      // Check value match (for exit/assign/branch)
      if (cpp.value !== undefined && ts.value !== undefined && cpp.value !== ts.value) {
        return {
          traceIndex: i,
          cppEntry: cpp,
          tsEntry: ts,
          type: "value_mismatch",
          description: `Value mismatch at ${i} in ${cpp.func}: C++ ${cpp.value} vs TS ${ts.value}`,
        };
      }

      // Check args match (for enter)
      if (cpp.args && ts.args) {
        for (let j = 0; j < Math.max(cpp.args.length, ts.args.length); j++) {
          if (cpp.args[j] !== ts.args[j]) {
            return {
              traceIndex: i,
              cppEntry: cpp,
              tsEntry: ts,
              type: "value_mismatch",
              description: `Arg ${j} mismatch at ${i} in ${cpp.func}: C++ ${cpp.args[j]} vs TS ${ts.args[j]}`,
            };
          }
        }
      }
    }
  }

  return null; // Traces match
}

/**
 * Find all divergences between two traces (not just the first).
 */
export function findAllDivergences(
  cppTrace: TraceEntry[],
  tsTrace: TraceEntry[],
  maxDivergences: number = 100
): TraceDivergence[] {
  const divergences: TraceDivergence[] = [];
  const maxLen = Math.min(cppTrace.length, tsTrace.length);

  for (let i = 0; i < maxLen && divergences.length < maxDivergences; i++) {
    const cpp = cppTrace[i];
    const ts = tsTrace[i];

    if (cpp.value !== undefined && ts.value !== undefined && cpp.value !== ts.value) {
      divergences.push({
        traceIndex: i,
        cppEntry: cpp,
        tsEntry: ts,
        type: "value_mismatch",
        description: `Value mismatch at ${i} in ${cpp.func}: C++ ${cpp.value} vs TS ${ts.value}`,
      });
    }
  }

  return divergences;
}
