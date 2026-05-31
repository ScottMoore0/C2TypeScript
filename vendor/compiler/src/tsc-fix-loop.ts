/**
 * Phase 19.4: Iterative TypeScript compilation error fixer.
 * Runs tsc, parses errors, applies fixes, repeats until clean.
 */

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { applyTscFix, setSymbolMap, ClassifiedError } from "./tsc-fixes.js";

export interface TscFixResult {
  success: boolean;
  iterations: number;
  fixesApplied: number;
  remainingErrors: number;
  log: string[];
}

interface TscError {
  file: string;
  line: number;
  col: number;
  code: number;
  message: string;
}

/**
 * Run tsc and collect errors.
 */
function runTsc(projectDir: string): TscError[] {
  const result = spawnSync("npx", ["tsc", "--noEmit", "--pretty", "false"], {
    cwd: projectDir,
    timeout: 60000,
    encoding: "utf-8",
    shell: true,
  });

  const output = (result.stdout ?? "") + (result.stderr ?? "");
  const errors: TscError[] = [];
  const pattern = /(.+?)\((\d+),(\d+)\):\s*error\s+TS(\d+):\s*(.+)/g;
  let match;

  while ((match = pattern.exec(output)) !== null) {
    errors.push({
      file: match[1].trim(),
      line: parseInt(match[2]),
      col: parseInt(match[3]),
      code: parseInt(match[4]),
      message: match[5].trim(),
    });
  }

  return errors;
}

/**
 * Classify a tsc error into a fix category.
 */
function classifyError(error: TscError): ClassifiedError {
  const msg = error.message;
  let category = "unknown";
  const data: ClassifiedError["data"] = {};

  if (error.code === 2304) {
    category = "missing_name";
    const m = msg.match(/Cannot find name '(\w+)'/);
    if (m) data.name = m[1];
  } else if (error.code === 2305) {
    category = "missing_export";
    const m = msg.match(/has no exported member '(\w+)'/);
    if (m) data.name = m[1];
  } else if (error.code === 2307) {
    category = "missing_module";
    const m = msg.match(/Cannot find module '([^']+)'/);
    if (m) data.modulePath = m[1];
  } else if (error.code === 2322) {
    category = "type_mismatch";
    const m = msg.match(/Type '([^']+)' is not assignable to type '([^']+)'/);
    if (m) { data.fromType = m[1]; data.toType = m[2]; }
  } else if (error.code === 2339) {
    category = "missing_property";
    const m = msg.match(/Property '(\w+)' does not exist on type '([^']+)'/);
    if (m) { data.name = m[1]; data.fromType = m[2]; }
  } else if (error.code === 2345) {
    category = "argument_mismatch";
  } else if (error.code === 2551) {
    category = "typo_suggestion";
    const m = msg.match(/Did you mean '(\w+)'/);
    if (m) data.suggestion = m[1];
    const n = msg.match(/Property '(\w+)'/);
    if (n) data.name = n[1];
  } else if (error.code === 2554) {
    category = "argument_count";
  } else if (error.code === 2532) {
    category = "possibly_undefined";
  } else if (error.code === 7006) {
    category = "implicit_any";
    const m = msg.match(/Parameter '(\w+)'/);
    if (m) data.name = m[1];
  } else if ([1002, 1003, 1005].includes(error.code)) {
    category = "syntax_error";
  } else if ([2300, 2696].includes(error.code)) {
    category = "duplicate_decl";
    const m = msg.match(/Duplicate identifier '(\w+)'/);
    if (m) data.name = m[1];
  }

  return { category, errorCode: error.code, file: error.file, line: error.line, col: error.col, message: msg, data };
}

/**
 * Iteratively fix TypeScript compilation errors until tsc passes.
 */
export function fixTscErrors(
  projectDir: string,
  maxIterations: number = 50,
  symbolMap?: Map<string, string>
): TscFixResult {
  if (symbolMap) setSymbolMap(symbolMap);

  const log: string[] = [];
  let totalFixes = 0;
  let prevErrorCount = Infinity;
  let staleCount = 0;

  for (let iter = 0; iter < maxIterations; iter++) {
    const errors = runTsc(projectDir);

    if (errors.length === 0) {
      log.push(`tsc clean after ${iter} iterations, ${totalFixes} fixes`);
      return { success: true, iterations: iter, fixesApplied: totalFixes, remainingErrors: 0, log };
    }

    log.push(`Iteration ${iter}: ${errors.length} tsc errors`);

    // Check for convergence stall
    if (errors.length >= prevErrorCount) {
      staleCount++;
      if (staleCount >= 3) {
        log.push(`Stalled at ${errors.length} errors. Stopping.`);
        return { success: false, iterations: iter, fixesApplied: totalFixes, remainingErrors: errors.length, log };
      }
    } else {
      staleCount = 0;
    }
    prevErrorCount = errors.length;

    // Group errors by file
    const byFile = new Map<string, TscError[]>();
    for (const err of errors) {
      const key = err.file;
      if (!byFile.has(key)) byFile.set(key, []);
      byFile.get(key)!.push(err);
    }

    // Fix one error per file per iteration (to avoid cascading conflicts)
    let fixedThisIter = 0;
    for (const [file, fileErrors] of byFile) {
      const firstError = fileErrors[0];
      const classified = classifyError(firstError);

      try {
        const filePath = join(projectDir, file);
        const code = readFileSync(filePath, "utf-8");
        const fixed = applyTscFix(code, classified);

        if (fixed !== code) {
          writeFileSync(filePath, fixed, "utf-8");
          fixedThisIter++;
          totalFixes++;
        }
      } catch {
        // File not found or read error — skip
      }
    }

    if (fixedThisIter === 0) {
      log.push(`No fixes applicable for ${errors.length} remaining errors. Stopping.`);
      return { success: false, iterations: iter, fixesApplied: totalFixes, remainingErrors: errors.length, log };
    }
  }

  return { success: false, iterations: maxIterations, fixesApplied: totalFixes, remainingErrors: prevErrorCount, log };
}
