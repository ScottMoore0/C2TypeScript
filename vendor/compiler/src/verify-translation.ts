/**
 * Oracle loop: translate → run C → run TS → compare → fix → repeat.
 * This is the core feedback loop that makes translations correct.
 */

import { execSync, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, basename, dirname } from "node:path";
import { compareOutputs, type ComparisonResult } from "./oracle-comparator.js";

export interface VerifyResult {
  file: string;
  cppOutput: { stdout: string; stderr: string; exitCode: number };
  tsOutput: { stdout: string; stderr: string; exitCode: number };
  comparison: ComparisonResult;
  fixesApplied: string[];
  iterations: number;
}

/**
 * Translate a single C/C++ file to TypeScript using the emitter.
 */
function translateFile(cFile: string, outDir: string): string {
  const name = basename(cFile, /\.cpp$/.test(cFile) ? ".cpp" : ".c");
  const tsFile = join(outDir, name + ".ts");
  const isC = cFile.endsWith(".c");

  // Get Clang AST
  const clangCmd = isC
    ? `clang -Xclang -ast-dump=json -fsyntax-only "${cFile}" 2>/dev/null`
    : `clang++ -std=c++17 -Xclang -ast-dump=json -fsyntax-only "${cFile}" 2>/dev/null`;

  let ast: string;
  try {
    ast = execSync(clangCmd, { encoding: "utf-8", maxBuffer: 100 * 1024 * 1024 });
  } catch (e: any) {
    // Clang may return non-zero but still produce AST
    ast = e.stdout ?? "";
    if (!ast || !ast.includes('"kind"')) {
      throw new Error(`Clang failed on ${cFile}: ${e.stderr?.substring(0, 200)}`);
    }
  }

  // Parse AST and emit TypeScript
  const { Emitter } = require("./emitter.js");
  const emitter = new Emitter({ wrapIntegers: true });
  const root = JSON.parse(ast);
  const tsCode = emitter.emit(root);

  writeFileSync(tsFile, tsCode);
  return tsFile;
}

/**
 * Compile and run a C/C++ file, capture output.
 */
function runC(cFile: string): { stdout: string; stderr: string; exitCode: number } {
  const isC = cFile.endsWith(".c");
  const outBin = cFile.replace(/\.(c|cpp)$/, "") + (process.platform === "win32" ? ".exe" : "");
  const compiler = isC ? "gcc" : "g++";

  try {
    execSync(`${compiler} -o "${outBin}" "${cFile}" -lm 2>&1`, { encoding: "utf-8" });
  } catch (e: any) {
    return { stdout: "", stderr: `Compile error: ${e.message?.substring(0, 300)}`, exitCode: -1 };
  }

  try {
    const result = spawnSync(outBin, [], { encoding: "utf-8", timeout: 10000 });
    return {
      stdout: result.stdout ?? "",
      stderr: result.stderr ?? "",
      exitCode: result.status ?? -1,
    };
  } catch (e: any) {
    return { stdout: "", stderr: e.message, exitCode: -1 };
  }
}

/**
 * Run a translated TypeScript file, capture output.
 */
function runTS(tsFile: string): { stdout: string; stderr: string; exitCode: number } {
  try {
    const result = spawnSync("npx", ["tsx", tsFile], {
      encoding: "utf-8",
      timeout: 10000,
      shell: true,
      cwd: dirname(tsFile),
    });
    return {
      stdout: result.stdout ?? "",
      stderr: result.stderr ?? "",
      exitCode: result.status ?? -1,
    };
  } catch (e: any) {
    return { stdout: "", stderr: e.message, exitCode: -1 };
  }
}

/**
 * Try to fix a divergence by applying candidate transformations.
 */
function tryFix(tsFile: string, comparison: ComparisonResult, cppResult: any): { fixed: boolean; fixName: string } {
  const code = readFileSync(tsFile, "utf-8");
  const original = code;

  // Candidate fixes ordered by likelihood
  const candidates = [
    {
      name: "integer_division",
      apply: (c: string) => c.replace(/(\w+)\s*\/\s*(\w+)/g, "Math.trunc($1 / $2)"),
    },
    {
      name: "unsigned_wrap",
      apply: (c: string) => c.replace(/([\w.]+\s*\+\s*[\w.]+)(\s*>>>)/g, "$1$2") // already wrapped
        || c.replace(/(\w+)\s*=\s*(\w+)\s*\+\s*1\s*;/g, "$1 = ($2 + 1) >>> 0;"),
    },
    {
      name: "struct_copy",
      apply: (c: string) => c.replace(
        /(\w+)\s*=\s*(\w+)\s*;(\s*\/\/ copy)/g,
        "$1 = structuredClone($2);$3"
      ),
    },
  ];

  for (const candidate of candidates) {
    const patched = candidate.apply(code);
    if (patched === code) continue;

    writeFileSync(tsFile, patched);
    const tsResult = runTS(tsFile);
    const newComparison = compareOutputs(cppResult, tsResult);

    if (newComparison.score > comparison.score) {
      return { fixed: true, fixName: candidate.name };
    }

    // Revert
    writeFileSync(tsFile, original);
  }

  return { fixed: false, fixName: "" };
}

/**
 * Main entry: verify a single C/C++ file translation.
 * Translate → run C → run TS → compare → fix → repeat.
 */
export function verifyTranslation(cFile: string, maxIterations: number = 5): VerifyResult {
  const outDir = join(dirname(cFile), "ts-output");
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  // Step 1: Translate
  const tsFile = translateFile(cFile, outDir);

  // Step 2: Run C
  const cppResult = runC(cFile);
  if (cppResult.exitCode === -1 && cppResult.stderr.includes("Compile error")) {
    return {
      file: cFile,
      cppOutput: cppResult,
      tsOutput: { stdout: "", stderr: "C compilation failed", exitCode: -1 },
      comparison: { matches: false, divergences: [], score: 0 },
      fixesApplied: [],
      iterations: 0,
    };
  }

  // Step 3: Run TS
  let tsResult = runTS(tsFile);

  // Step 4: Compare
  let comparison = compareOutputs(cppResult, tsResult);
  const fixesApplied: string[] = [];
  let iterations = 0;

  // Step 5: Fix loop
  while (!comparison.matches && iterations < maxIterations) {
    iterations++;
    const fix = tryFix(tsFile, comparison, cppResult);
    if (!fix.fixed) break; // No more fixes to try

    fixesApplied.push(fix.fixName);
    tsResult = runTS(tsFile);
    comparison = compareOutputs(cppResult, tsResult);
  }

  return {
    file: cFile,
    cppOutput: cppResult,
    tsOutput: tsResult,
    comparison,
    fixesApplied,
    iterations,
  };
}

/**
 * Verify all C files in a directory.
 */
export function verifyAll(dir: string): VerifyResult[] {
  const { readdirSync } = require("fs");
  const files = readdirSync(dir).filter((f: string) => f.endsWith(".c") || f.endsWith(".cpp"));
  return files.map((f: string) => verifyTranslation(join(dir, f)));
}
