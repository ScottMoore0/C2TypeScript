/**
 * Streaming Clang AST runner for large projects.
 * Uses shell redirect to temp file, then filters system nodes before parsing.
 * Handles 300MB+ AST JSON files (e.g., Stratagus produces 293MB per file).
 */

import { spawnSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import type { ASTNode } from "./ast-types.js";
import { createIsolatedTempFile } from "./iteration-speed.js";

/**
 * Run Clang, write AST to temp file, filter, parse.
 * Uses shell redirect (>) to avoid Node.js buffer limits.
 */
export async function dumpASTStreaming(
  sourcePath: string,
  extraArgs: string[] = [],
  tempDir?: string
): Promise<{ ast: ASTNode }> {
  const clang = process.env.CLANG_PATH || "clang++";
  const isC = /\.c$/i.test(sourcePath);
  const langArgs = isC ? ["-x", "c", "-std=c17"] : ["-std=c++17"];
  const tempFile = createIsolatedTempFile("clang-ast", ".json", tempDir);
  const tmp = tempFile.filePath;

  // Use execSync with shell redirect — most reliable cross-platform for large output
  // Build args: MinGW target avoids MSVC header conflicts on Windows
  const platformArgs = process.platform === "win32"
    ? ["--target=x86_64-w64-mingw32", "-nostdinc++",
       "-IC:/msys64/ucrt64/include/c++/15.2.0",
       "-IC:/msys64/ucrt64/include/c++/15.2.0/x86_64-w64-mingw32",
       "-IC:/msys64/ucrt64/x86_64-w64-mingw32/include"]
    : [];
  const allArgs = ["-Xclang", "-ast-dump=json", "-fsyntax-only",
    "-Wno-everything", "-ferror-limit=0",
    ...platformArgs, ...langArgs, ...extraArgs, sourcePath.replace(/\\/g, "/")];
  const cmd = `${clang} ${allArgs.join(" ")} > "${tmp.replace(/\\/g, "/")}"`;
  spawnSync("bash", ["-c", cmd], { timeout: 300000, encoding: "utf-8" });

  // Check file was written
  let fileSize = 0;
  try { fileSize = statSync(tmp).size; } catch {}
  if (fileSize === 0) {
    tempFile.cleanup();
    // Try without redirect to get error message
    const errResult = spawnSync(clang, ["-fsyntax-only", "-Wno-everything", ...langArgs, ...extraArgs, sourcePath], {
      timeout: 30000, encoding: "utf-8",
    });
    const errors = (errResult.stderr ?? "").split("\n").filter(l => l.includes("fatal error:")).slice(0, 3);
    throw new Error(errors.length > 0 ? errors.join("; ") : "Clang produced empty output");
  }

  // Read and filter — handle files larger than Node's max string size
  try {
    const size = statSync(tmp).size;

    if (size < 400 * 1024 * 1024) {
      // Small enough to read as string
      const raw = readFileSync(tmp, "utf-8");
      const ast = JSON.parse(raw) as ASTNode;
      if (ast.inner) {
        const before = ast.inner.length;
        ast.inner = ast.inner.filter(n => !isSystemNode(n));
        process.stderr.write(`  [AST] ${before} → ${ast.inner.length} nodes\n`);
      }
      return { ast };
    }

    // Too large for a single string — use chunked extraction
    process.stderr.write(`  [AST] File is ${(size/1024/1024).toFixed(0)}MB, using chunked filter...\n`);
    const ast = extractASTChunked(tmp);
    return { ast };
  } finally {
    tempFile.cleanup();
  }
}

/**
 * Extract AST from a very large JSON file (>500MB) by reading in chunks.
 * Finds each top-level node in the "inner" array, checks if it's from a
 * system header (by looking at the first few hundred bytes), and only
 * parses non-system nodes.
 */
export function extractASTChunkedSync(filePath: string): ASTNode {
  return extractASTChunked(filePath);
}

function extractASTChunked(filePath: string): ASTNode {
  const fd = require("fs").openSync(filePath, "r");
  const fileSize = statSync(filePath).size;
  const CHUNK = 64 * 1024; // 64KB chunks
  const buf = Buffer.alloc(CHUNK);

  // Read first 200 bytes to get the TranslationUnitDecl header
  require("fs").readSync(fd, buf, 0, 200, 0);
  const header = buf.slice(0, 200).toString("utf-8");

  // Find the start of the "inner" array
  let pos = 0;
  let innerStart = -1;
  const searchBuf = Buffer.alloc(1024 * 1024); // 1MB for scanning

  // Scan for '"inner": [' in the first 2KB
  require("fs").readSync(fd, searchBuf, 0, Math.min(2048, fileSize), 0);
  const headerStr = searchBuf.slice(0, 2048).toString("utf-8");
  innerStart = headerStr.indexOf('"inner": [');

  if (innerStart === -1) {
    require("fs").closeSync(fd);
    return { id: "0", kind: "TranslationUnitDecl", inner: [] } as any;
  }

  pos = innerStart + '"inner": ['.length;

  // Now scan through the file, extracting top-level inner nodes
  // Each node starts with { at depth 0 and ends with } at depth 0
  const keptNodes: any[] = [];
  let depth = 0;
  let nodeStart = -1;
  let inString = false;
  let escaped = false;
  let bytesRead = 0;
  let nodeCount = 0;
  let chunk = Buffer.alloc(256 * 1024); // 256KB read buffer

  while (pos < fileSize) {
    const toRead = Math.min(chunk.length, fileSize - pos);
    const n = require("fs").readSync(fd, chunk, 0, toRead, pos);
    if (n === 0) break;

    for (let i = 0; i < n; i++) {
      const ch = chunk[i];

      if (escaped) { escaped = false; continue; }
      if (ch === 0x5C) { escaped = true; continue; } // backslash
      if (ch === 0x22) { inString = !inString; continue; } // quote
      if (inString) continue;

      if (ch === 0x7B) { // {
        if (depth === 0) nodeStart = pos + i;
        depth++;
      } else if (ch === 0x7D) { // }
        depth--;
        if (depth === 0 && nodeStart >= 0) {
          nodeCount++;
          const nodeSize = (pos + i + 1) - nodeStart;

          // Only parse small-ish nodes and check if they're from user code
          // Read just the first 500 bytes of the node to check location
          const peekSize = Math.min(500, nodeSize);
          const peekBuf = Buffer.alloc(peekSize);
          require("fs").readSync(fd, peekBuf, 0, peekSize, nodeStart);
          const peek = peekBuf.toString("utf-8");

          if (!isSystemNodeText(peek)) {
            // Read the full node and parse it
            if (nodeSize < 100 * 1024 * 1024) { // < 100MB per node
              const nodeBuf = Buffer.alloc(nodeSize);
              require("fs").readSync(fd, nodeBuf, 0, nodeSize, nodeStart);
              try {
                const node = JSON.parse(nodeBuf.toString("utf-8"));
                keptNodes.push(node);
              } catch {}
            }
          }

          nodeStart = -1;
        }
      } else if (ch === 0x5D && depth === 0) { // ] at depth 0 = end of inner array
        break;
      }
    }

    pos += n;
  }

  require("fs").closeSync(fd);
  process.stderr.write(`  [AST] Chunked: ${nodeCount} total nodes, ${keptNodes.length} user nodes kept\n`);

  return {
    id: "0",
    kind: "TranslationUnitDecl",
    inner: keptNodes,
  } as any;
}

function isSystemNodeText(text: string): boolean {
  if (text.includes('"isImplicit": true') || text.includes('"isImplicit":true')) return true;
  const sys = ["msys64", "LLVM", "mingw", "Windows Kits", "MSVC", "ucrt",
    "/usr/", "/lib/clang/", "include\\\\c++", "include/c++"];
  for (const p of sys) { if (text.includes(p)) return true; }
  // Don't blanket-reject includedFrom — that drops user-relative #includes
  // (the amalgam pattern: driver.c includes "lua/lapi.c", and we want the
  // included content kept). Only filter when the includedFrom's file path
  // looks system-y. The 500-byte peek usually contains the includedFrom
  // file path; if that path has a system marker, drop it.
  const incIdx = text.indexOf('"includedFrom"');
  if (incIdx >= 0) {
    const fileIdx = text.indexOf('"file"', incIdx);
    if (fileIdx >= 0) {
      const tail = text.slice(fileIdx, fileIdx + 400);
      for (const p of sys) { if (tail.includes(p)) return true; }
    }
  }
  return false;
}

function isSystemNode(node: any): boolean {
  if (node.isImplicit) return true;
  const loc = node.loc;
  if (!loc) return true;

  const file: string = loc.file ?? loc.spellingLoc?.file ?? loc.expansionLoc?.file ?? "";
  const inc: string = loc.includedFrom?.file ?? loc.spellingLoc?.includedFrom?.file ?? "";

  const sys = ["msys64", "LLVM", "mingw", "Windows Kits", "MSVC", "ucrt",
               "/usr/", "/lib/clang/", "include\\c++\\", "include/c++/"];
  for (const p of sys) {
    if (file.includes(p) || inc.includes(p)) return true;
  }
  return false;
}

export function chooseParsingStrategy(sourcePath: string, _extraArgs: string[]): "buffer" | "streaming" {
  const source = readFileSync(sourcePath, "utf-8");
  return (source.match(/#include/g) || []).length > 10 ? "streaming" : "buffer";
}
