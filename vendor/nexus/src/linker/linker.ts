// NC-5: Linker — the top-level multi-file composition engine.
// Takes a set of translated TS files, resolves symbols, generates imports,
// and produces a linked module graph.

import { extractDefinedSymbols, extractReferencedSymbols, type SymbolInfo } from "../symbols/extract.js";
import { buildDependencyGraph, type DependencyGraph, type FileNode } from "../graph/graph.js";
import { topologicalSort, graphEdgesToSets, type SortResult } from "../graph/sort.js";
import { generateImports, generateLazyRegistration, generateEntryPoint, type ImportDirective } from "./imports.js";
import { resolveSymbols, makeIsWeakSymbol, type SymbolEntry, type ResolveResult } from "./resolve.js";

export interface SourceFile {
  path: string;
  content: string;
}

export interface LinkResult {
  /** Files in topological order. */
  sortedFiles: string[];
  /** Generated import blocks per file (path → import lines). */
  imports: Map<string, string[]>;
  /** Lazy registrations for cycle participants (path → registration lines). */
  lazyRegistrations: Map<string, string[]>;
  /** Files involved in dependency cycles. */
  cycleFiles: Set<string>;
  /** Symbols that couldn't be resolved. */
  unresolvedSymbols: Map<string, string[]>;
  /** Duplicate symbol definitions. */
  duplicateSymbols: Map<string, string[]>;
  /** The full dependency graph. */
  graph: DependencyGraph;
  /** Sort result with cycle info. */
  sort: SortResult;
  /**
   * C-linkage-aware resolution result when the caller supplies SymbolEntry
   * metadata (linkage + storageClass). Undefined when no entries were given.
   */
  linkageResolution?: ResolveResult;
  /**
   * Predicate: was a given external symbol satisfied by a weak definition?
   * Always defined; returns false when no linkage metadata was supplied.
   */
  isWeakSymbol: (name: string) => boolean;
}

export interface LinkOptions {
  /** Optional C-linkage metadata for defined symbols. */
  symbolEntries?: SymbolEntry[];
}

/** Link a set of translated TypeScript source files. */
export function link(files: SourceFile[], options: LinkOptions = {}): LinkResult {
  // 1. Extract symbols from each file.
  const fileNodes: FileNode[] = files.map(f => {
    const defined = new Set(extractDefinedSymbols(f.content).map(s => s.name));
    const referenced = extractReferencedSymbols(f.content, defined);
    return { path: f.path, defined, referenced };
  });

  // 2. Build dependency graph.
  const graph = buildDependencyGraph(fileNodes);

  // 3. Topological sort.
  const edgeSets = graphEdgesToSets(graph.edges);
  const sort = topologicalSort(files.map(f => f.path), edgeSets);

  // 4. Identify cycle participants.
  const cycleFiles = new Set(sort.cycles.flat());

  // 5. Generate imports for each file.
  const imports = new Map<string, string[]>();
  const lazyRegistrations = new Map<string, string[]>();

  for (const f of files) {
    const fileEdges = graph.edges.get(f.path);
    if (!fileEdges || fileEdges.size === 0) {
      imports.set(f.path, []);
      continue;
    }

    const directives: ImportDirective[] = [];
    for (const [depPath, symbols] of fileEdges) {
      const isLazy = cycleFiles.has(f.path) && cycleFiles.has(depPath);
      directives.push({ fromFile: depPath, symbols, isLazy });
    }

    imports.set(f.path, generateImports(directives, baseName));

    // Lazy registrations for cycle participants.
    if (cycleFiles.has(f.path)) {
      const defined = [...(graph.nodes.get(f.path)?.defined ?? [])];
      lazyRegistrations.set(f.path, generateLazyRegistration(defined));
    }
  }

  // 6. Detect duplicate symbols.
  const duplicateSymbols = new Map<string, string[]>();
  const symProviders = new Map<string, string[]>();
  for (const f of fileNodes) {
    for (const sym of f.defined) {
      if (!symProviders.has(sym)) symProviders.set(sym, []);
      symProviders.get(sym)!.push(f.path);
    }
  }
  for (const [sym, providers] of symProviders) {
    if (providers.length > 1) duplicateSymbols.set(sym, providers);
  }

  // 7. C-linkage-aware resolution (weak + static dedup) when metadata given.
  let linkageResolution: ResolveResult | undefined;
  let isWeakSymbol: (name: string) => boolean = () => false;
  if (options.symbolEntries && options.symbolEntries.length > 0) {
    linkageResolution = resolveSymbols(options.symbolEntries);
    isWeakSymbol = makeIsWeakSymbol(linkageResolution);

    // Under C linkage rules, duplicate-detection should not flag names that
    // only have multiple definitions because of per-TU `static` (internal
    // linkage) — those aren't duplicates at all.
    const nameIsStaticOnly = new Map<string, boolean>();
    const nameHasExtern = new Set<string>();
    for (const e of options.symbolEntries) {
      const sc = e.storageClass ?? "extern";
      if (sc === "static") {
        if (!nameHasExtern.has(e.name) && !nameIsStaticOnly.has(e.name)) {
          nameIsStaticOnly.set(e.name, true);
        }
      } else {
        nameHasExtern.add(e.name);
        nameIsStaticOnly.set(e.name, false);
      }
    }
    for (const name of [...duplicateSymbols.keys()]) {
      if (nameIsStaticOnly.get(name) === true) {
        duplicateSymbols.delete(name);
      }
    }
  }

  return {
    sortedFiles: sort.sorted,
    imports,
    lazyRegistrations,
    cycleFiles,
    unresolvedSymbols: graph.unresolved,
    duplicateSymbols,
    graph,
    sort,
    linkageResolution,
    isWeakSymbol,
  };
}

function baseName(path: string): string {
  const slash = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
  const name = slash >= 0 ? path.substring(slash + 1) : path;
  return name.replace(/\.ts$/, "");
}
