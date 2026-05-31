/**
 * Analyzes translated TypeScript files and adds import/export statements
 * for cross-file references. Uses regex-based parsing.
 */

import * as path from "path";

export interface SymbolInfo {
  name: string;
  kind: "function" | "class" | "const" | "variable";
  sourceFile: string;
}

const DECL_RE = /^(?:export\s+)?(?:(function)\s+(\w+)|(class)\s+(\w+)|(const|let|var)\s+(\w+))/gm;
const IDENT_RE = /\b([A-Z_]\w*|\w+)\b/g;
const BUILTIN = new Set([
  "number", "string", "boolean", "void", "null", "undefined", "any", "never",
  "unknown", "true", "false", "console", "Math", "Array", "Map", "Set",
  "Promise", "Error", "Object", "String", "Number", "Boolean", "Symbol",
  "if", "else", "for", "while", "do", "return", "switch", "case", "break",
  "continue", "new", "this", "super", "typeof", "instanceof", "in", "of",
  "import", "export", "from", "default", "const", "let", "var", "function",
  "class", "extends", "implements", "interface", "type", "enum", "async",
  "await", "try", "catch", "finally", "throw", "yield", "delete", "void",
]);

/** Regex-based extraction of top-level declared names from TS code. */
export function extractDeclarations(code: string): string[] {
  const names: string[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(DECL_RE.source, "gm");
  while ((m = re.exec(code)) !== null) {
    const name = m[2] || m[4] || m[6];
    if (name) names.push(name);
  }
  return names;
}

/** Find identifier names used in code but not declared in the locals set. */
export function findUndefinedReferences(code: string, locals: Set<string>): string[] {
  const refs = new Set<string>();
  const re = new RegExp(IDENT_RE.source, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(code)) !== null) {
    const id = m[1];
    if (!locals.has(id) && !BUILTIN.has(id)) refs.add(id);
  }
  return [...refs];
}

export class ImportResolver {
  private symbols = new Map<string, SymbolInfo>();

  registerSymbol(name: string, kind: SymbolInfo["kind"], sourceFile: string): void {
    this.symbols.set(name, { name, kind, sourceFile });
  }

  analyzeFile(tsCode: string, sourceFile: string): { exports: string[]; imports: Map<string, string[]> } {
    const declared = extractDeclarations(tsCode);
    const locals = new Set(declared);
    for (const name of declared) {
      this.registerSymbol(name, this.inferKind(tsCode, name), sourceFile);
    }
    const undefinedRefs = findUndefinedReferences(tsCode, locals);
    const imports = new Map<string, string[]>();
    for (const ref of undefinedRefs) {
      const sym = this.symbols.get(ref);
      if (sym && sym.sourceFile !== sourceFile) {
        const existing = imports.get(sym.sourceFile) ?? [];
        existing.push(ref);
        imports.set(sym.sourceFile, existing);
      }
    }
    return { exports: declared, imports };
  }

  resolveImports(files: Map<string, string>): Map<string, string> {
    // First pass: register all symbols
    for (const [filename, code] of files) {
      extractDeclarations(code).forEach((name) => {
        this.registerSymbol(name, this.inferKind(code, name), filename);
      });
    }
    // Second pass: build output with imports/exports
    const result = new Map<string, string>();
    for (const [filename, code] of files) {
      const { exports, imports } = this.analyzeFile(code, filename);
      const lines: string[] = [];
      for (const [srcFile, names] of imports) {
        const rel = this.relativePath(filename, srcFile);
        lines.push(`import { ${names.join(", ")} } from "${rel}";`);
      }
      if (lines.length) lines.push("");
      let transformed = code;
      for (const name of exports) {
        transformed = transformed.replace(
          new RegExp(`^((?:async\\s+)?(?:function|class|const|let|var)\\s+${name}\\b)`, "m"),
          "export $1"
        );
      }
      lines.push(transformed);
      result.set(filename, lines.join("\n"));
    }
    return result;
  }

  private inferKind(code: string, name: string): SymbolInfo["kind"] {
    if (new RegExp(`\\bfunction\\s+${name}\\b`).test(code)) return "function";
    if (new RegExp(`\\bclass\\s+${name}\\b`).test(code)) return "class";
    if (new RegExp(`\\bconst\\s+${name}\\b`).test(code)) return "const";
    return "variable";
  }

  private relativePath(from: string, to: string): string {
    const fromDir = path.posix.dirname(from);
    let rel = path.posix.relative(fromDir, to).replace(/\.ts$/, ".js");
    if (!rel.startsWith(".")) rel = "./" + rel;
    return rel;
  }
}
