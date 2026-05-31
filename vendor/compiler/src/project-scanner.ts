/**
 * Phase 53: Multi-file project support.
 * Scans a directory for C++ source files and determines compilation units.
 */

import { readdirSync, statSync, readFileSync, existsSync } from "node:fs";
import { join, extname, relative, basename } from "node:path";

export type Language = "c" | "cpp" | "lua";

export interface SourceFile {
  path: string;
  relativePath: string;
  isHeader: boolean;
  language: Language;
}

export interface ProjectInfo {
  rootDir: string;
  sourceFiles: SourceFile[];
  headerFiles: SourceFile[];
  compilationUnits: SourceFile[]; // .cpp and .c files
  luaFiles: SourceFile[];         // .lua files
  includeDirs: string[];
}

const CPP_EXTENSIONS = new Set([".cpp", ".cc", ".cxx", ".c++"]);
const C_EXTENSIONS = new Set([".c"]);
const LUA_EXTENSIONS = new Set([".lua"]);
const HEADER_EXTENSIONS = new Set([".h", ".hpp", ".hxx", ".h++", ".hh"]);

/**
 * Scan a directory recursively for C++ source and header files.
 */
export function scanProject(rootDir: string): ProjectInfo {
  const sourceFiles: SourceFile[] = [];
  const headerFiles: SourceFile[] = [];
  const luaFiles: SourceFile[] = [];
  const includeDirs = new Set<string>();

  function walk(dir: string): void {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = join(dir, entry);

      // Skip common non-source directories
      if (entry === "node_modules" || entry === ".git" || entry === "build" ||
          entry === "cmake-build-debug" || entry === "cmake-build-release" ||
          entry === ".vs" || entry === ".idea" || entry === "__pycache__") {
        continue;
      }

      let stat;
      try {
        stat = statSync(fullPath);
      } catch {
        continue;
      }

      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (stat.isFile()) {
        const ext = extname(entry).toLowerCase();
        const relPath = relative(rootDir, fullPath).replace(/\\/g, "/");

        if (CPP_EXTENSIONS.has(ext)) {
          sourceFiles.push({ path: fullPath, relativePath: relPath, isHeader: false, language: "cpp" });
        } else if (C_EXTENSIONS.has(ext)) {
          sourceFiles.push({ path: fullPath, relativePath: relPath, isHeader: false, language: "c" });
        } else if (LUA_EXTENSIONS.has(ext)) {
          luaFiles.push({ path: fullPath, relativePath: relPath, isHeader: false, language: "lua" });
        } else if (HEADER_EXTENSIONS.has(ext)) {
          headerFiles.push({ path: fullPath, relativePath: relPath, isHeader: true, language: "cpp" });
          includeDirs.add(dir);
        }
      }
    }
  }

  walk(rootDir);

  // Also check for CMakeLists.txt to extract include directories
  const cmakePath = join(rootDir, "CMakeLists.txt");
  if (existsSync(cmakePath)) {
    const cmakeContent = readFileSync(cmakePath, "utf-8");
    const includeMatches = cmakeContent.matchAll(/include_directories\s*\(\s*([^)]+)\)/gi);
    for (const match of includeMatches) {
      const dirs = match[1].split(/\s+/).filter(d => d && !d.startsWith("$"));
      for (const d of dirs) {
        const absDir = join(rootDir, d);
        if (existsSync(absDir)) includeDirs.add(absDir);
      }
    }
  }

  // Add root dir as default include path
  includeDirs.add(rootDir);

  return {
    rootDir,
    sourceFiles: [...sourceFiles, ...headerFiles, ...luaFiles],
    headerFiles,
    compilationUnits: sourceFiles,
    luaFiles,
    includeDirs: [...includeDirs],
  };
}

/**
 * Parse a CMakeLists.txt to extract source file list.
 * Returns null if no CMakeLists.txt or can't parse.
 */
export function parseCMakeSources(rootDir: string): string[] | null {
  const cmakePath = join(rootDir, "CMakeLists.txt");
  if (!existsSync(cmakePath)) return null;

  const content = readFileSync(cmakePath, "utf-8");
  const sources: string[] = [];

  // Match add_executable or add_library source lists
  const addMatches = content.matchAll(/(?:add_executable|add_library)\s*\(\s*\w+\s+([^)]+)\)/gi);
  for (const match of addMatches) {
    const files = match[1].split(/\s+/).filter(f =>
      f && !f.startsWith("$") && !f.startsWith("#") &&
      (CPP_EXTENSIONS.has(extname(f).toLowerCase()) || HEADER_EXTENSIONS.has(extname(f).toLowerCase()))
    );
    sources.push(...files.map(f => join(rootDir, f)));
  }

  return sources.length > 0 ? sources : null;
}
