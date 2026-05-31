/**
 * Phase I1: Library usage scanner.
 * Scans translated .ts files for calls to external C/C++ library functions.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { getAllShims } from "./shim-database.js";

export interface LibraryUsage {
  cFunction: string;
  library: string;
  file: string;
  count: number;
}

/**
 * Scan a project directory for calls to known library functions.
 */
export function scanLibraryUsage(projectDir: string): LibraryUsage[] {
  const allShims = getAllShims();
  const shimNames = new Set(allShims.map(s => s.cFunction));
  const usageMap = new Map<string, { library: string; files: Map<string, number> }>();

  // Build reverse lookup: function name → library
  const funcToLib = new Map<string, string>();
  for (const [lib, entries] of Object.entries(require("./shim-database.js").shimDatabase)) {
    for (const e of entries as any[]) {
      funcToLib.set(e.cFunction, lib);
    }
  }

  function walk(dir: string): void {
    for (const entry of readdirSync(dir)) {
      if (["node_modules", "shims", "runtime", "data"].includes(entry)) continue;
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) { walk(full); continue; }
      if (!entry.endsWith(".ts") || entry.endsWith(".d.ts")) continue;

      const code = readFileSync(full, "utf-8");
      const rel = relative(projectDir, full).replace(/\\/g, "/");

      // Find all function-call-like patterns
      for (const m of code.matchAll(/\b(\w+)\s*\(/g)) {
        const name = m[1];
        if (shimNames.has(name)) {
          if (!usageMap.has(name)) {
            usageMap.set(name, { library: funcToLib.get(name) ?? "unknown", files: new Map() });
          }
          const entry = usageMap.get(name)!;
          entry.files.set(rel, (entry.files.get(rel) ?? 0) + 1);
        }
      }
    }
  }

  walk(projectDir);

  const results: LibraryUsage[] = [];
  for (const [func, info] of usageMap) {
    let total = 0;
    for (const count of info.files.values()) total += count;
    results.push({ cFunction: func, library: info.library, file: [...info.files.keys()].join(", "), count: total });
  }

  return results.sort((a, b) => b.count - a.count);
}

const HEADER_EXTS = new Set([".h", ".hpp", ".hxx", ".hh", ".inl", ".inc"]);
const SOURCE_EXTS = new Set([".c", ".cpp", ".cc", ".cxx"]);

/**
 * Check if a library directory contains only header files (no .c/.cpp/.cc/.cxx).
 * Header-only libraries should be included in translation rather than shimmed.
 */
export function isHeaderOnly(libPath: string): boolean {
  if (!existsSync(libPath) || !statSync(libPath).isDirectory()) return false;

  let hasHeaders = false;

  function walk(dir: string): boolean {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const st = statSync(full);
      if (st.isDirectory()) {
        if (!walk(full)) return false;
      } else {
        const ext = extname(entry).toLowerCase();
        if (SOURCE_EXTS.has(ext)) return false;
        if (HEADER_EXTS.has(ext)) hasHeaders = true;
      }
    }
    return true;
  }

  const noSources = walk(libPath);
  return noSources && hasHeaders;
}
