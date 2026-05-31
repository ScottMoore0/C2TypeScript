import { readFileSync, existsSync } from 'fs';
import { join, dirname, basename } from 'path';

export interface DepNode {
  name: string;
  path: string;
  deps: string[];
}

export function extractDependencies(sourceFile: string): string[] {
  const content = readFileSync(sourceFile, 'utf-8');
  const deps: string[] = [];
  // Match #include "local.h" (not <system.h>)
  const includeRegex = /#include\s+"([^"]+)"/g;
  let m;
  while ((m = includeRegex.exec(content)) !== null) {
    deps.push(m[1]);
  }
  // Match linked libraries from common patterns
  // -lfoo in comments or build files
  return deps;
}

export function buildDependencyGraph(projectDir: string, sourceFiles: string[]): DepNode[] {
  const nodes = new Map<string, DepNode>();

  for (const file of sourceFiles) {
    const name = basename(file).replace(/\.(c|cpp|cc|cxx|h|hpp)$/, '');
    const deps = extractDependencies(file);
    nodes.set(name, { name, path: file, deps });
  }

  return topologicalSort(Array.from(nodes.values()));
}

export function topologicalSort(nodes: DepNode[]): DepNode[] {
  const visited = new Set<string>();
  const sorted: DepNode[] = [];
  const nodeMap = new Map(nodes.map(n => [n.name, n]));

  function visit(name: string) {
    if (visited.has(name)) return;
    visited.add(name);
    const node = nodeMap.get(name);
    if (!node) return;
    for (const dep of node.deps) {
      const depName = basename(dep).replace(/\.(c|cpp|cc|cxx|h|hpp)$/, '');
      visit(depName);
    }
    sorted.push(node);
  }

  for (const node of nodes) visit(node.name);
  return sorted; // leaves first (dependencies before dependents)
}
