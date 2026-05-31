/**
 * Phase C1: Extract Lua↔C++ binding pairs from translated TypeScript output.
 *
 * Scans for patterns:
 *   lua_pushcclosure(Lua, ((CclFoo)), 0), lua_setglobal(Lua, ("Foo"))
 *   lua_register(L, "Foo", CclFoo)
 *
 * Outputs: array of { luaName, cppFunction, sourceFile }
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

export interface BindingPair {
  luaName: string;
  cppFunction: string;
  sourceFile: string;
}

export interface CclFunctionLocation {
  name: string;
  file: string;
  line: number;
  exported: boolean;
}

/**
 * Scan translated .ts files for lua_setglobal registration patterns.
 */
export function extractBindings(projectDir: string): BindingPair[] {
  const pairs: BindingPair[] = [];
  const seen = new Set<string>();

  function walk(dir: string): void {
    for (const entry of readdirSync(dir)) {
      if (["node_modules", "scripts", "shims", "runtime", "data"].includes(entry)) continue;
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) { walk(full); continue; }
      if (!entry.endsWith(".ts") || entry === "_types.ts" || entry === "bindings.ts" || entry === "bootstrap.ts") continue;
      if (entry.endsWith(".mjs") || entry.endsWith(".d.ts")) continue;

      const code = readFileSync(full, "utf-8");
      const rel = relative(projectDir, full).replace(/\\/g, "/");

      // Pattern 1: lua_pushcclosure(Lua, ((CclFoo)), 0), lua_setglobal(Lua, ("Foo"))
      for (const m of code.matchAll(/lua_pushcclosure\(\w+,\s*\(\((\w+)\)\),\s*0\),\s*lua_setglobal\(\w+,\s*\("(\w+)"\)\)/g)) {
        const key = m[2];
        if (!seen.has(key)) {
          seen.add(key);
          pairs.push({ luaName: m[2], cppFunction: m[1], sourceFile: rel });
        }
      }

      // Pattern 2: lua_register(L, "Foo", CclFoo)
      for (const m of code.matchAll(/lua_register\(\w+,\s*"(\w+)",\s*(\w+)\)/g)) {
        const key = m[1];
        if (!seen.has(key)) {
          seen.add(key);
          pairs.push({ luaName: m[1], cppFunction: m[2], sourceFile: rel });
        }
      }

      // Pattern 3: lua_pushcfunction(L, CclFoo) followed by lua_setglobal(L, "Foo")
      const lines = code.split("\n");
      for (let i = 0; i < lines.length - 1; i++) {
        const pushMatch = lines[i].match(/lua_pushcfunction\(\w+,\s*(\w+)\)/);
        const setMatch = lines[i + 1]?.match(/lua_setglobal\(\w+,\s*"(\w+)"\)/);
        if (pushMatch && setMatch) {
          const key = setMatch[1];
          if (!seen.has(key)) {
            seen.add(key);
            pairs.push({ luaName: setMatch[1], cppFunction: pushMatch[1], sourceFile: rel });
          }
        }
      }
    }
  }

  walk(projectDir);
  return pairs;
}

/**
 * Locate each Ccl function definition in the translated output.
 */
export function locateCclFunctions(projectDir: string, pairs: BindingPair[]): Map<string, CclFunctionLocation> {
  const locations = new Map<string, CclFunctionLocation>();
  const needed = new Set(pairs.map(p => p.cppFunction));

  function walk(dir: string): void {
    for (const entry of readdirSync(dir)) {
      if (["node_modules", "scripts", "shims", "runtime", "data"].includes(entry)) continue;
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) { walk(full); continue; }
      if (!entry.endsWith(".ts")) continue;

      const code = readFileSync(full, "utf-8");
      const rel = relative(projectDir, full).replace(/\\/g, "/");
      const lines = code.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(/^(export\s+)?function\s+(\w+)\s*\(/);
        if (match && needed.has(match[2])) {
          locations.set(match[2], {
            name: match[2],
            file: rel,
            line: i + 1,
            exported: !!match[1],
          });
        }
      }
    }
  }

  walk(projectDir);
  return locations;
}

/**
 * Generate a bindings.ts file that connects Lua names to real C++ functions.
 */
export function generateBindings(
  pairs: BindingPair[],
  locations: Map<string, CclFunctionLocation>,
  projectDir: string,
): string {
  const imports = new Map<string, Set<string>>(); // file → set of function names
  const lines: string[] = [
    "/**",
    " * Auto-generated Lua↔C++ bindings.",
    " * Maps Lua function names to their translated C++ implementations.",
    " */",
    "",
    "// Lua state adapter",
    "const _luaState = { stack: [] as any[], globals: new Map<string, any>() };",
    "",
    "function _pushArg(v: any): void {",
    "  if (typeof v === 'number') { _luaState.stack.push(v); }",
    "  else if (typeof v === 'string') { _luaState.stack.push(v); }",
    "  else if (typeof v === 'boolean') { _luaState.stack.push(v); }",
    "  else if (v === null || v === undefined) { _luaState.stack.push(null); }",
    "  else if (typeof v === 'object') {",
    "    // Push table: push the object itself (Ccl functions will access it)",
    "    _luaState.stack.push(v);",
    "  }",
    "  else { _luaState.stack.push(v); }",
    "}",
    "",
    "function _callCcl(fn: Function, args: any[]): any {",
    "  _luaState.stack = [...args];",
    "  try {",
    "    const nresults = fn(_luaState);",
    "    if (typeof nresults === 'number' && nresults > 0 && _luaState.stack.length > 0) {",
    "      return _luaState.stack[_luaState.stack.length - 1];",
    "    }",
    "    return undefined;",
    "  } catch (e: any) {",
    "    console.warn(`[binding] ${fn.name}():`, e?.message || e);",
    "    return undefined;",
    "  }",
    "}",
    "",
    "const _warned = new Set<string>();",
    "function _warnOnce(name: string): void {",
    "  if (!_warned.has(name)) { _warned.add(name); console.warn(`[bindings] STUB: ${name}`); }",
    "}",
    "",
  ];

  // Group imports by file
  for (const pair of pairs) {
    const loc = locations.get(pair.cppFunction);
    if (loc) {
      const file = loc.file.replace(/\.ts$/, ".js");
      if (!imports.has(file)) imports.set(file, new Set());
      imports.get(file)!.add(pair.cppFunction);
    }
  }

  // Emit imports
  for (const [file, funcs] of imports) {
    const relPath = "./" + file;
    lines.push(`import { ${[...funcs].join(", ")} } from "${relPath}";`);
  }
  lines.push("");

  // Emit binding functions
  let real = 0, stubbed = 0;
  for (const pair of pairs) {
    const loc = locations.get(pair.cppFunction);
    if (loc) {
      lines.push(`export function ${pair.luaName}(...args: any[]): any { return _callCcl(${pair.cppFunction}, args); }`);
      real++;
    } else {
      lines.push(`export function ${pair.luaName}(...args: any[]): any { _warnOnce("${pair.luaName}"); }`);
      stubbed++;
    }
  }

  lines.push("");
  lines.push(`// ${real} real bindings, ${stubbed} stubs`);
  lines.push(`console.log("[bindings] ${real} real + ${stubbed} stubs = ${pairs.length} total Lua functions");`);
  lines.push("");

  // Re-export everything from _types.ts for scripts that import from bindings
  lines.push('export * from "./_types.js";');
  lines.push("");

  // Gettext translation function
  lines.push("export function _(s: string): string { return s; }");

  return lines.join("\n");
}
