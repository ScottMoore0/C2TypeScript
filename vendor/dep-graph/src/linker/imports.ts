// NC-4: Import generation — emit ESM import/export statements.

export interface ImportDirective {
  fromFile: string;     // source file path (without extension)
  symbols: string[];    // symbols to import
  isLazy: boolean;      // true if this is a cycle-breaking lazy import
}

/** Generate ESM import statements for a file's dependencies. */
export function generateImports(
  directives: ImportDirective[],
  baseName: (path: string) => string
): string[] {
  const lines: string[] = [];

  for (const d of directives) {
    const moduleName = baseName(d.fromFile);
    if (d.isLazy) {
      // Cycle-breaking: use lazy global registration.
      for (const sym of d.symbols) {
        lines.push(
          `let ${sym}: any = (...args: any[]) => ` +
          `((globalThis as any).__lazy_${sym} ?? ((...a: any[]) => undefined))(...args);`
        );
      }
    } else {
      const uniqueSyms = [...new Set(d.symbols)].sort();
      lines.push(`import { ${uniqueSyms.join(", ")} } from "./${moduleName}.js";`);
    }
  }

  return lines;
}

/** Generate lazy symbol registration for cycle participants. */
export function generateLazyRegistration(definedSymbols: string[]): string[] {
  return definedSymbols
    .filter(s => s !== "main")
    .map(s => `(globalThis as any).__lazy_${s} = ${s};`);
}

/** Generate a re-export barrel file that exports all symbols from all modules. */
export function generateBarrelFile(
  modules: Array<{ path: string; exportedSymbols: string[] }>,
  baseName: (path: string) => string
): string {
  const lines: string[] = [];
  for (const m of modules) {
    if (m.exportedSymbols.length > 0) {
      const name = baseName(m.path);
      lines.push(`export { ${m.exportedSymbols.join(", ")} } from "./${name}.js";`);
    }
  }
  return lines.join("\n") + "\n";
}

/** Generate a main entry file that imports all modules and calls main(). */
export function generateEntryPoint(
  sortedModules: string[],
  mainFile: string,
  baseName: (path: string) => string
): string {
  const lines: string[] = [];

  // Import all modules in dependency order (side effects).
  for (const m of sortedModules) {
    if (m !== mainFile) {
      lines.push(`import "./${baseName(m)}.js";`);
    }
  }

  // Import and call main from the main file.
  lines.push(`import { main } from "./${baseName(mainFile)}.js";`);
  lines.push("");
  lines.push("process.exit(main());");

  return lines.join("\n") + "\n";
}
