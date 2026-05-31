// Nexus — Linking, Loading, and Multi-Module Integration

export { extractDefinedSymbols, extractDefinedNames, extractReferencedSymbols, isBuiltin, isKeyword, type SymbolInfo } from "./symbols/extract.js";
export { buildDependencyGraph, getDependencies, getDependents, getAllEdges, findDuplicateSymbols, type FileNode, type DependencyEdge, type DependencyGraph } from "./graph/graph.js";
export { topologicalSort, graphEdgesToSets, type SortResult } from "./graph/sort.js";
export { generateImports, generateLazyRegistration, generateBarrelFile, generateEntryPoint, type ImportDirective } from "./linker/imports.js";
export { link, type SourceFile, type LinkResult, type LinkOptions } from "./linker/linker.js";
export {
  resolveWeak,
  dedupeStaticSymbols,
  resolveSymbols,
  mangleStatic,
  makeIsWeakSymbol,
  type SymbolEntry,
  type Linkage,
  type StorageClass,
  type ResolveResult,
} from "./linker/resolve.js";
