// EC-2: AST traversal utilities.

import type { ASTNode } from "./nodes.js";

/** Visit every node in the AST, calling the visitor function. */
export function walk(node: ASTNode, visitor: (node: ASTNode, depth: number) => void, depth: number = 0): void {
  visitor(node, depth);
  if (node.inner) {
    for (const child of node.inner) {
      walk(child, visitor, depth + 1);
    }
  }
}

/** Find all nodes matching a predicate. */
export function findAll(root: ASTNode, predicate: (node: ASTNode) => boolean): ASTNode[] {
  const results: ASTNode[] = [];
  walk(root, (node) => {
    if (predicate(node)) results.push(node);
  });
  return results;
}

/** Find all nodes of a specific kind. */
export function findByKind(root: ASTNode, kind: string): ASTNode[] {
  return findAll(root, n => n.kind === kind);
}

/** Find the first node matching a predicate. */
export function findFirst(root: ASTNode, predicate: (node: ASTNode) => boolean): ASTNode | null {
  let found: ASTNode | null = null;
  walk(root, (node) => {
    if (!found && predicate(node)) found = node;
  });
  return found;
}

/** Get the direct children of a node (non-implicit). */
export function children(node: ASTNode): ASTNode[] {
  return (node.inner ?? []).filter(n => !n.isImplicit);
}

/** Get ALL children including implicit ones. */
export function allChildren(node: ASTNode): ASTNode[] {
  return node.inner ?? [];
}

/** Count nodes in the AST. */
export function countNodes(root: ASTNode): number {
  let count = 0;
  walk(root, () => { count++; });
  return count;
}

/** Get the source file of a node. */
export function getFile(node: ASTNode): string | undefined {
  return node.loc?.file ?? node.range?.begin?.file;
}

/** Get the source line of a node. */
export function getLine(node: ASTNode): number | undefined {
  return node.loc?.line ?? node.range?.begin?.line;
}

/** Get a human-readable description of a node. */
export function describe(node: ASTNode): string {
  const parts = [node.kind];
  if (node.name) parts.push(`'${node.name}'`);
  if (node.type?.qualType) parts.push(`<${node.type.qualType}>`);
  if (node.opcode) parts.push(node.opcode);
  if (node.value !== undefined) parts.push(String(node.value));
  const loc = getLine(node);
  if (loc) parts.push(`line:${loc}`);
  return parts.join(" ");
}
