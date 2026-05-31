// NC-2: Dependency graph — build, query, and topologically sort.

export interface FileNode {
  path: string;
  defined: Set<string>;
  referenced: string[];
}

export interface DependencyEdge {
  from: string;   // file that references
  to: string;     // file that provides
  symbols: string[];  // which symbols are needed
}

export interface DependencyGraph {
  nodes: Map<string, FileNode>;
  edges: Map<string, Map<string, string[]>>;  // from → (to → symbols[])
  symbolProviders: Map<string, string>;        // symbol → providing file
  unresolved: Map<string, string[]>;           // file → unresolved symbols
}

/** Build a dependency graph from a set of file nodes. */
export function buildDependencyGraph(files: FileNode[]): DependencyGraph {
  const nodes = new Map<string, FileNode>();
  const symbolProviders = new Map<string, string>();

  // Register all defined symbols.
  for (const f of files) {
    nodes.set(f.path, f);
    for (const sym of f.defined) {
      // First definition wins (C linker semantics).
      if (!symbolProviders.has(sym)) {
        symbolProviders.set(sym, f.path);
      }
    }
  }

  // Build edges based on references.
  const edges = new Map<string, Map<string, string[]>>();
  const unresolved = new Map<string, string[]>();

  for (const f of files) {
    const fileEdges = new Map<string, string[]>();
    const fileUnresolved: string[] = [];

    for (const ref of f.referenced) {
      const provider = symbolProviders.get(ref);
      if (provider && provider !== f.path) {
        if (!fileEdges.has(provider)) fileEdges.set(provider, []);
        fileEdges.get(provider)!.push(ref);
      } else if (!provider && !f.defined.has(ref)) {
        fileUnresolved.push(ref);
      }
    }

    edges.set(f.path, fileEdges);
    if (fileUnresolved.length > 0) {
      unresolved.set(f.path, fileUnresolved);
    }
  }

  return { nodes, edges, symbolProviders, unresolved };
}

/** Get the direct dependencies of a file (files it imports from). */
export function getDependencies(graph: DependencyGraph, path: string): string[] {
  const fileEdges = graph.edges.get(path);
  return fileEdges ? [...fileEdges.keys()] : [];
}

/** Get the reverse dependencies (files that depend on this file). */
export function getDependents(graph: DependencyGraph, path: string): string[] {
  const result: string[] = [];
  for (const [from, edges] of graph.edges) {
    if (edges.has(path)) result.push(from);
  }
  return result;
}

/** Get all edges as a flat list. */
export function getAllEdges(graph: DependencyGraph): DependencyEdge[] {
  const result: DependencyEdge[] = [];
  for (const [from, targets] of graph.edges) {
    for (const [to, symbols] of targets) {
      result.push({ from, to, symbols });
    }
  }
  return result;
}

/** Detect files with duplicate symbol definitions. */
export function findDuplicateSymbols(files: FileNode[]): Map<string, string[]> {
  const providers = new Map<string, string[]>();
  for (const f of files) {
    for (const sym of f.defined) {
      if (!providers.has(sym)) providers.set(sym, []);
      providers.get(sym)!.push(f.path);
    }
  }
  const dupes = new Map<string, string[]>();
  for (const [sym, files] of providers) {
    if (files.length > 1) dupes.set(sym, files);
  }
  return dupes;
}
