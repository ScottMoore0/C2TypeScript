// EC-3: Clang AST JSON runner.
// Invokes clang to get the JSON AST dump of a C/C++ source file.

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { ASTNode } from "../ast/nodes.js";

const execFileAsync = promisify(execFile);

export interface ClangOptions {
  /** Path to clang executable. Defaults to CLANG_PATH env or "clang++". */
  clangPath?: string;
  /** Extra compiler flags. */
  extraArgs?: string[];
  /** C language standard. Default: "c17" for .c files. */
  cStandard?: string;
  /** C++ language standard. Default: "c++20" for .cpp files. */
  cppStandard?: string;
  /** Max buffer size in bytes. Default: 500MB. */
  maxBuffer?: number;
}

export interface ClangResult {
  ast: ASTNode;
  raw: string;
  warnings: string[];
}

/** Find the clang executable. */
function findClang(opts?: ClangOptions): string {
  if (opts?.clangPath) return opts.clangPath;
  if (process.env.CLANG_PATH) return process.env.CLANG_PATH;
  return "clang++";
}

/** Determine if a file is C (not C++) by extension. */
function isCFile(path: string): boolean {
  return /\.c$/i.test(path);
}

/** Run clang -Xclang -ast-dump=json on a source file. */
export async function dumpAST(sourcePath: string, opts?: ClangOptions): Promise<ClangResult> {
  const clang = findClang(opts);
  const isC = isCFile(sourcePath);
  const langArgs = isC
    ? ["-x", "c", `-std=${opts?.cStandard ?? "c17"}`]
    : [`-std=${opts?.cppStandard ?? "c++20"}`];

  const args = [
    "-Xclang", "-ast-dump=json",
    "-fsyntax-only",
    ...langArgs,
    ...(opts?.extraArgs ?? []),
    sourcePath,
  ];

  const { stdout, stderr } = await execFileAsync(clang, args, {
    maxBuffer: opts?.maxBuffer ?? 500 * 1024 * 1024,
  });

  const warnings: string[] = [];
  if (stderr) {
    const lines = stderr.split("\n");
    const errors = lines.filter(l => l.includes("error:"));
    warnings.push(...lines.filter(l => l.includes("warning:")));
    if (errors.length > 0) {
      throw new ClangError(errors.join("\n"), sourcePath);
    }
  }

  const ast = JSON.parse(stdout) as ASTNode;
  return { ast, raw: stdout, warnings };
}

/** Parse a JSON AST string directly (for testing without clang). */
export function parseAST(json: string): ASTNode {
  return JSON.parse(json) as ASTNode;
}

/** Error from Clang compilation. */
export class ClangError extends Error {
  constructor(message: string, public readonly sourcePath: string) {
    super(`Clang error in ${sourcePath}: ${message}`);
    this.name = "ClangError";
  }
}
