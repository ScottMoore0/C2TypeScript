/**
 * Phase 48: Pointer usage analysis.
 * Scans the AST to determine which pointers need the low-level (ArrayBuffer)
 * tier vs the idiomatic (object reference) tier.
 *
 * Low-level tier needed when:
 * - Pointer arithmetic: p + n, p[i], p++
 * - void* pointers
 * - reinterpret_cast between pointer types
 * - Array decay with arithmetic
 *
 * Idiomatic tier (default) when:
 * - Simple T* p = &obj; p->member
 * - new/delete with no arithmetic
 * - Function pointer (mapped to TS function type)
 */

import type { ASTNode } from "./ast-types.js";

export type PointerTier = "idiomatic" | "lowlevel";

export interface PointerAnalysis {
  /** Map from VarDecl ID to its tier */
  varTiers: Map<string, PointerTier>;
  /** Whether any low-level pointers were found */
  hasLowLevel: boolean;
}

/**
 * Analyze an AST to determine pointer tiers.
 */
export function analyzePointers(root: ASTNode): PointerAnalysis {
  const varTiers = new Map<string, PointerTier>();
  let hasLowLevel = false;

  function walk(node: ASTNode): void {
    // Detect pointer arithmetic: BinaryOperator with + or - on pointer type
    if (node.kind === "BinaryOperator") {
      const n = node as any;
      const resultType: string = n.type?.qualType ?? "";
      if (resultType.includes("*") && ["+", "-"].includes(n.opcode)) {
        // One operand is a pointer — mark it as low-level
        for (const child of node.inner ?? []) {
          markLowLevel(child, varTiers);
        }
        hasLowLevel = true;
      }
    }

    // Detect reinterpret_cast on pointers
    if (node.kind === "CXXReinterpretCastExpr") {
      hasLowLevel = true;
      for (const child of node.inner ?? []) {
        markLowLevel(child, varTiers);
      }
    }

    // Detect void* variables
    if (node.kind === "VarDecl") {
      const n = node as any;
      const t: string = n.type?.qualType ?? "";
      if (t === "void *" || t === "const void *") {
        varTiers.set(n.id, "lowlevel");
        hasLowLevel = true;
      }
    }

    // Detect array subscript on pointer (not array) type
    if (node.kind === "ArraySubscriptExpr") {
      const children = node.inner ?? [];
      if (children.length > 0) {
        const arrType: string = (children[0] as any)?.type?.qualType ?? "";
        if (arrType.includes("*") && !arrType.includes("[")) {
          markLowLevel(children[0], varTiers);
          hasLowLevel = true;
        }
      }
    }

    for (const child of node.inner ?? []) {
      walk(child);
    }
  }

  function markLowLevel(node: ASTNode, tiers: Map<string, PointerTier>): void {
    if (node.kind === "DeclRefExpr") {
      const id = (node as any)?.referencedDecl?.id;
      if (id) tiers.set(id, "lowlevel");
    }
    if (node.kind === "ImplicitCastExpr" || node.kind === "ParenExpr") {
      for (const child of node.inner ?? []) {
        markLowLevel(child, tiers);
      }
    }
  }

  walk(root);

  return { varTiers, hasLowLevel };
}
