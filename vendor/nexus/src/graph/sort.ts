// NC-3: Topological sort with cycle detection.

export interface SortResult {
  sorted: string[];       // topologically sorted order
  cycles: string[][];     // detected cycles (each is a group of nodes)
  hasCycles: boolean;
}

/** Topological sort using Kahn's algorithm.
 *  Edges: from → to means "from depends on to" (to must come before from).
 *  Output: dependencies first, dependents last. */
export function topologicalSort(
  nodes: string[],
  edges: Map<string, Set<string>>
): SortResult {
  // Reverse edges: build "provides" graph (to → [froms that depend on it]).
  const reverse = new Map<string, Set<string>>();
  const inDegree = new Map<string, number>();
  for (const n of nodes) { reverse.set(n, new Set()); inDegree.set(n, 0); }

  for (const [from, targets] of edges) {
    // from depends on each target → from has in-degree += targets.size
    inDegree.set(from, (inDegree.get(from) ?? 0) + targets.size);
    for (const t of targets) {
      if (!reverse.has(t)) reverse.set(t, new Set());
      reverse.get(t)!.add(from);
    }
  }

  // Start with nodes that have no dependencies (in-degree 0).
  const queue = nodes.filter(n => (inDegree.get(n) ?? 0) === 0).sort();
  const sorted: string[] = [];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const node = queue.shift()!;
    if (visited.has(node)) continue;
    visited.add(node);
    sorted.push(node);

    // Nodes that depend on this node can now have their in-degree reduced.
    const dependents = reverse.get(node);
    if (dependents) {
      for (const dep of dependents) {
        const deg = (inDegree.get(dep) ?? 1) - 1;
        inDegree.set(dep, deg);
        if (deg === 0 && !visited.has(dep)) {
          queue.push(dep);
          queue.sort();
        }
      }
    }
  }

  // Any remaining nodes are in cycles.
  const remaining = nodes.filter(n => !visited.has(n));
  const cycles: string[][] = [];

  if (remaining.length > 0) {
    // Group into SCCs using simple DFS.
    const cycleGroups = findSCCs(remaining, edges);
    cycles.push(...cycleGroups);
    // Append cycle nodes in deterministic order.
    for (const group of cycleGroups) {
      for (const n of group.sort()) {
        sorted.push(n);
      }
    }
  }

  return { sorted, cycles, hasCycles: cycles.length > 0 };
}

/** Simple SCC detection for cycle grouping. */
function findSCCs(nodes: string[], edges: Map<string, Set<string>>): string[][] {
  const nodeSet = new Set(nodes);
  const visited = new Set<string>();
  const groups: string[][] = [];

  for (const start of nodes) {
    if (visited.has(start)) continue;
    // BFS to find connected component within remaining nodes.
    const group: string[] = [];
    const queue = [start];
    while (queue.length > 0) {
      const n = queue.shift()!;
      if (visited.has(n)) continue;
      visited.add(n);
      group.push(n);
      const targets = edges.get(n);
      if (targets) {
        for (const t of targets) {
          if (nodeSet.has(t) && !visited.has(t)) queue.push(t);
        }
      }
      // Also check reverse edges.
      for (const [from, targets] of edges) {
        if (targets.has(n) && nodeSet.has(from) && !visited.has(from)) {
          queue.push(from);
        }
      }
    }
    if (group.length > 0) groups.push(group);
  }

  return groups;
}

/** Convert DependencyGraph edges to simple Set<string> edges for sorting. */
export function graphEdgesToSets(
  edges: Map<string, Map<string, string[]>>
): Map<string, Set<string>> {
  const result = new Map<string, Set<string>>();
  for (const [from, targets] of edges) {
    result.set(from, new Set(targets.keys()));
  }
  return result;
}
