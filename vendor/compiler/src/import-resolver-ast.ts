/**
 * AST-based cross-file import resolver.
 * Uses Clang's AST to determine exactly which declarations are in which files,
 * replacing the regex-based import resolver for C/C++ projects.
 */

import { readFileSync } from "node:fs";
import { join, relative, dirname, basename } from "node:path";
import type { ASTNode } from "./ast-types.js";

export interface SymbolLocation {
  name: string;
  kind: "function" | "class" | "variable" | "enum" | "typedef";
  sourceFile: string;  // the .cpp/.c file where it's defined
  headerFile?: string; // the .h file where it's declared (if any)
  id: string;         // Clang AST node ID
}

/**
 * Extract all top-level symbol definitions from a Clang AST,
 * tracking which source file each one originates from.
 */
export function extractSymbols(ast: ASTNode, sourceFile: string): SymbolLocation[] {
  const symbols: SymbolLocation[] = [];

  for (const node of ast.inner ?? []) {
    const n = node as any;

    // Skip system headers
    if (n.loc?.includedFrom) continue;
    if (n.isImplicit) continue;
    const file = n.loc?.file ?? n.loc?.spellingLoc?.file ?? "";
    if (file && (file.includes("\\LLVM\\") || file.includes("\\mingw") ||
        file.includes("\\Windows Kits\\") || file.includes("/usr/"))) continue;

    const locFile = n.loc?.file ?? sourceFile;
    const isFromHeader = locFile.endsWith(".h") || locFile.endsWith(".hpp");

    if (node.kind === "FunctionDecl" && n.name && !n.name.startsWith("__")) {
      // Only count definitions (have a CompoundStmt body), not declarations
      const hasBody = (node.inner ?? []).some(c => c.kind === "CompoundStmt");
      if (hasBody) {
        symbols.push({
          name: n.name, kind: "function", sourceFile,
          headerFile: isFromHeader ? locFile : undefined, id: n.id,
        });
      }
    }

    if (node.kind === "CXXRecordDecl" && n.name && n.completeDefinition) {
      symbols.push({
        name: n.name, kind: "class", sourceFile,
        headerFile: isFromHeader ? locFile : undefined, id: n.id,
      });
    }

    if (node.kind === "RecordDecl" && n.name && n.completeDefinition) {
      symbols.push({
        name: n.name, kind: "class", sourceFile,
        headerFile: isFromHeader ? locFile : undefined, id: n.id,
      });
    }

    if (node.kind === "VarDecl" && n.name && !n.name.startsWith("__")) {
      symbols.push({
        name: n.name, kind: "variable", sourceFile,
        headerFile: isFromHeader ? locFile : undefined, id: n.id,
      });
    }

    if (node.kind === "EnumDecl") {
      // C17 §6.7.2.2: enum enumerators have file-scope visibility. Register
      // each enumerator name independently so cross-TU import resolution can
      // wire `OP_FORPREP` from Lua's anonymous `typedef enum { ... } OpCode;`
      // back to the TU that defines it. Named-enum symbols (under n.name)
      // are still registered for `enum X` references.
      if (n.name) {
        symbols.push({
          name: n.name, kind: "enum", sourceFile,
          headerFile: isFromHeader ? locFile : undefined, id: n.id,
        });
      }
      for (const mem of node.inner ?? []) {
        const mm = mem as any;
        if (mm.kind === "EnumConstantDecl" && mm.name) {
          symbols.push({
            name: mm.name, kind: "enum", sourceFile,
            headerFile: isFromHeader ? locFile : undefined, id: mm.id,
          });
        }
      }
    }

    if (node.kind === "FunctionTemplateDecl" || node.kind === "ClassTemplateDecl") {
      if (n.name) {
        symbols.push({
          name: n.name, kind: node.kind.includes("Function") ? "function" : "class",
          sourceFile, headerFile: isFromHeader ? locFile : undefined, id: n.id,
        });
      }
    }
  }

  return symbols;
}

/**
 * Given all symbols across all files, resolve imports for each .ts file.
 * Returns a map of filename → import statements to prepend.
 */
export function resolveImportsFromSymbols(
  fileSymbols: Map<string, SymbolLocation[]>,
  translatedFiles: Map<string, string>,
  projectDir: string
): Map<string, string> {
  // Build global symbol → source file map
  const globalSymbols = new Map<string, string>(); // name → ts file path
  for (const [sourceFile, symbols] of fileSymbols) {
    const tsFile = sourceFile.replace(/\.\w+$/, ".ts");
    for (const sym of symbols) {
      globalSymbols.set(sym.name, tsFile);
    }
  }

  const result = new Map<string, string>();

  for (const [tsFile, code] of translatedFiles) {
    const imports = new Map<string, Set<string>>(); // fromFile → {symbol names}

    // Find all identifiers used in this file
    const usedNames = new Set<string>();
    const identifierPattern = /\b([A-Z]\w+|[a-z]\w+)\b/g;
    let match;
    while ((match = identifierPattern.exec(code)) !== null) {
      usedNames.add(match[1]);
    }

    // Find which used names are defined in other files
    for (const name of usedNames) {
      const definedIn = globalSymbols.get(name);
      if (definedIn && definedIn !== tsFile) {
        if (!imports.has(definedIn)) imports.set(definedIn, new Set());
        imports.get(definedIn)!.add(name);
      }
    }

    // Generate import statements
    const importLines: string[] = [];
    for (const [fromFile, names] of imports) {
      const relPath = relative(dirname(tsFile), fromFile)
        .replace(/\\/g, "/")
        .replace(/\.ts$/, ".js");
      const rel = relPath.startsWith(".") ? relPath : "./" + relPath;
      importLines.push(`import { ${[...names].join(", ")} } from "${rel}";`);
    }

    // Add export to all top-level declarations in the code
    let exportedCode = code
      .replace(/^(function\s+\w+)/gm, "export $1")
      .replace(/^(class\s+\w+)/gm, "export $1")
      .replace(/^(const\s+\w+)/gm, "export $1")
      .replace(/^(let\s+\w+)/gm, "export $1");

    result.set(tsFile, importLines.join("\n") + (importLines.length ? "\n\n" : "") + exportedCode);
  }

  return result;
}
