/**
 * Atom 0.2: Clang AST JSON runner
 * Shells out to clang to get the JSON AST dump of a C++ source file.
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { ASTNode } from "./ast-types.js";

const execFileAsync = promisify(execFile);

/** Find the clang executable */
function findClang(): string {
  // Check common locations
  const candidates = [
    "clang++",
    "clang",
    "C:/LLVM/bin/clang++.exe",
    "C:/Program Files/LLVM/bin/clang++.exe",
    "C:/Program Files/LLVM/bin/clang.exe",
    "C:/Program Files (x86)/LLVM/bin/clang++.exe",
  ];

  // Use the first one; actual resolution happens at exec time
  return process.env.CLANG_PATH || candidates[0];
}

export interface ClangResult {
  ast: ASTNode;
  raw: string;
}

/**
 * Run clang -Xclang -ast-dump=json on the given source file.
 * Returns the parsed AST root node.
 */
export async function dumpAST(sourcePath: string, extraArgs: string[] = []): Promise<ClangResult> {
  const clang = findClang();

  // Detect C vs C++ by file extension
  const isC = /\.c$/i.test(sourcePath);
  const langArgs = isC
    ? ["-x", "c", "-std=c17"]
    : ["-std=c++23"];

  const args = [
    "-Xclang", "-ast-dump=json",
    "-fsyntax-only",
    ...langArgs,
    ...extraArgs,
    sourcePath,
  ];

  const { stdout, stderr } = await execFileAsync(clang, args, {
    maxBuffer: 500 * 1024 * 1024, // 500 MB — Stratagus ASTs are very large
  });

  if (stderr && !stderr.includes("warning")) {
    // Warnings are OK, errors are not
    const errors = stderr.split("\n").filter(l => l.includes("error:"));
    if (errors.length > 0) {
      throw new Error(`Clang errors:\n${errors.join("\n")}`);
    }
  }

  const ast = JSON.parse(stdout) as ASTNode;
  return { ast, raw: stdout };
}

/**
 * Parse a JSON AST string directly (for testing without clang).
 */
export function parseAST(json: string): ASTNode {
  return JSON.parse(json) as ASTNode;
}
