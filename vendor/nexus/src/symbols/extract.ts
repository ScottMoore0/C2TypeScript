// NC-1: Symbol extraction from TypeScript source files.
// Extracts defined symbols (functions, classes, variables) and
// referenced symbols (identifiers used but not defined locally).

const JS_BUILTINS = new Set([
  "console", "process", "require", "module", "exports", "global", "globalThis",
  "Math", "Array", "Object", "String", "Number", "Boolean", "Date", "RegExp",
  "Error", "TypeError", "RangeError", "SyntaxError", "ReferenceError",
  "JSON", "Map", "Set", "WeakMap", "WeakSet", "Promise",
  "Buffer", "Uint8Array", "Int8Array", "Int16Array", "Uint16Array",
  "Int32Array", "Uint32Array", "Float32Array", "Float64Array",
  "ArrayBuffer", "DataView", "SharedArrayBuffer", "Atomics",
  "Symbol", "Proxy", "Reflect", "TextEncoder", "TextDecoder",
  "setTimeout", "setInterval", "clearTimeout", "clearInterval",
  "undefined", "null", "NaN", "Infinity", "true", "false",
  "parseInt", "parseFloat", "isNaN", "isFinite", "performance",
  "btoa", "atob", "fetch", "URL", "URLSearchParams",
  "OffscreenCanvas", "document", "window", "navigator",
]);

const JS_KEYWORDS = new Set([
  "if", "else", "for", "while", "do", "switch", "case", "default", "break",
  "continue", "return", "throw", "try", "catch", "finally", "new", "delete",
  "typeof", "instanceof", "void", "in", "of", "class", "extends", "super",
  "this", "import", "export", "from", "as", "let", "const", "var", "function",
  "async", "await", "yield", "static", "get", "set", "enum", "type", "interface",
  "implements", "declare", "readonly", "abstract", "private", "protected", "public",
  "any", "number", "string", "boolean", "never", "unknown", "void", "null", "undefined",
]);

export interface SymbolInfo {
  name: string;
  kind: "function" | "class" | "variable" | "type";
  exported: boolean;
  line: number;
}

/** Extract symbols defined in a TypeScript source file. */
export function extractDefinedSymbols(content: string): SymbolInfo[] {
  const symbols: SymbolInfo[] = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    // export function name(...) or function name(...)
    const fnMatch = line.match(/^(export\s+)?function\s+(\w+)/);
    if (fnMatch) {
      symbols.push({ name: fnMatch[2]!, kind: "function", exported: !!fnMatch[1], line: i + 1 });
      continue;
    }
    // export class name or class name
    const classMatch = line.match(/^(export\s+)?class\s+(\w+)/);
    if (classMatch) {
      symbols.push({ name: classMatch[2]!, kind: "class", exported: !!classMatch[1], line: i + 1 });
      continue;
    }
    // export const/let/var name or const/let/var name
    const varMatch = line.match(/^(export\s+)?(?:const|let|var)\s+(\w+)/);
    if (varMatch) {
      symbols.push({ name: varMatch[2]!, kind: "variable", exported: !!varMatch[1], line: i + 1 });
      continue;
    }
    // export type/interface name
    const typeMatch = line.match(/^(export\s+)?(?:type|interface)\s+(\w+)/);
    if (typeMatch) {
      symbols.push({ name: typeMatch[2]!, kind: "type", exported: !!typeMatch[1], line: i + 1 });
    }
  }

  return symbols;
}

/** Get just the symbol names from a source file. */
export function extractDefinedNames(content: string): string[] {
  return extractDefinedSymbols(content).map(s => s.name);
}

/** Extract identifiers that are referenced but not defined in this file. */
export function extractReferencedSymbols(content: string, definedNames: Set<string>): string[] {
  // Strip comments and strings to avoid false positives.
  const stripped = content
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/`(?:[^`\\]|\\.)*`/g, "``");

  const allIdents = new Set<string>();
  for (const m of stripped.matchAll(/\b([A-Za-z_$]\w*)\b/g)) {
    allIdents.add(m[1]!);
  }

  // Exclude property accesses (after dot).
  const propAccess = new Set<string>();
  for (const m of stripped.matchAll(/\.(\w+)/g)) {
    propAccess.add(m[1]!);
  }

  const refs: string[] = [];
  for (const id of allIdents) {
    if (definedNames.has(id)) continue;
    if (JS_BUILTINS.has(id)) continue;
    if (JS_KEYWORDS.has(id)) continue;
    if (id.length <= 1) continue;
    if (/^\d/.test(id)) continue;
    // Skip common type-only references
    if (id.startsWith("__")) continue;
    refs.push(id);
  }

  return [...new Set(refs)].sort();
}

/** Check if a symbol name is a JS builtin. */
export function isBuiltin(name: string): boolean {
  return JS_BUILTINS.has(name);
}

/** Check if a symbol name is a JS keyword. */
export function isKeyword(name: string): boolean {
  return JS_KEYWORDS.has(name);
}
