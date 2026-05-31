/**
 * R1.4: Foreign Function Resolver
 *
 * Given an unresolved function name, resolves it through a cascade:
 *   1. Shim lookup (shim-database.ts)
 *   2. Source check (is the function defined in a .c/.cpp file in the project?)
 *   3. Wasm placeholder (flag for future Wasm compilation)
 *   4. Stub fallback (generate a console.warn stub)
 */

import { findShimFull } from "./shim-database.js";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

export interface ResolveResult {
  strategy: "shim" | "translate" | "wasm-pending" | "stub";
  code: string;
  diagnostic?: string;
}

export class ForeignFunctionResolver {
  /**
   * Resolve a foreign function name to a strategy + code.
   *
   * @param funcName   The unresolved function name
   * @param sourceDir  Optional directory containing original C/C++ sources
   */
  resolve(funcName: string, sourceDir?: string): ResolveResult {
    // Step 1 (R1.4b): Shim lookup
    const shimCode = findShimFull(funcName);
    if (shimCode) {
      return { strategy: "shim", code: shimCode };
    }

    // Step 2 (R1.4c): Source check — look for definition in .c/.cpp files
    if (sourceDir && existsSync(sourceDir)) {
      const sourcePath = this.findSourceDefinition(funcName, sourceDir);
      if (sourcePath) {
        return {
          strategy: "translate",
          code: "",
          diagnostic: `source available at ${sourcePath}`,
        };
      }
    }

    // Step 3 (R1.4d): Wasm placeholder
    // In the future, this would trigger Wasm compilation of the C source.
    // For now, fall through to stub unless we have a strong signal for Wasm.
    // (Reserved for when Wasm compilation pipeline is implemented.)

    // Step 4 (R1.4e): Stub fallback
    const stubCode = `function ${funcName}(...args: any[]): any { console.warn("[STUB] ${funcName} not implemented"); return 0; }`;
    return {
      strategy: "stub",
      code: stubCode,
      diagnostic: `no shim or source found for ${funcName}`,
    };
  }

  /**
   * R1.4c: Search sourceDir for .c/.cpp/.h files that contain a definition
   * of funcName. Uses a simple heuristic: looks for `funcName(` preceded
   * by a type-like pattern at line start (not inside a comment or string).
   */
  private findSourceDefinition(funcName: string, sourceDir: string): string | null {
    const extensions = [".c", ".cpp", ".cc", ".cxx", ".h", ".hpp"];
    try {
      const entries = this.collectSourceFiles(sourceDir, extensions, 3);
      // Simple regex: funcName followed by ( at a definition site
      // Matches patterns like: type funcName(  or  type* funcName(
      const defPattern = new RegExp(
        `(?:^|\\n)\\s*(?:\\w[\\w\\s*&]*\\s+\\*?)${funcName}\\s*\\(`,
        "m"
      );
      for (const filePath of entries) {
        try {
          const content = readFileSync(filePath, "utf-8");
          if (defPattern.test(content)) {
            return filePath;
          }
        } catch {
          // Skip unreadable files
        }
      }
    } catch {
      // sourceDir not accessible
    }
    return null;
  }

  /**
   * Recursively collect source files up to a given depth.
   */
  private collectSourceFiles(dir: string, extensions: string[], maxDepth: number): string[] {
    if (maxDepth < 0) return [];
    const results: string[] = [];
    try {
      const entries = readdirSync(dir);
      for (const entry of entries) {
        const fullPath = join(dir, entry);
        try {
          const st = statSync(fullPath);
          if (st.isDirectory() && !entry.startsWith(".") && entry !== "node_modules") {
            results.push(...this.collectSourceFiles(fullPath, extensions, maxDepth - 1));
          } else if (st.isFile() && extensions.some(ext => entry.endsWith(ext))) {
            results.push(fullPath);
          }
        } catch {
          // Skip inaccessible entries
        }
      }
    } catch {
      // Skip inaccessible directories
    }
    return results;
  }
}
