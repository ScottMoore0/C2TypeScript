// Ember — Clang AST Frontend

// AST node types
export { type ASTNode, type QualType, type SourceLocation, type SourceRange,
  DECL_KINDS, STMT_KINDS, EXPR_KINDS,
  isDecl, isStmt, isExpr
} from "./ast/nodes.js";

// AST traversal
export {
  walk, findAll, findByKind, findFirst,
  children, allChildren, countNodes,
  getFile, getLine, describe
} from "./ast/traverse.js";

// Clang runner
export { dumpAST, parseAST, ClangError, type ClangOptions, type ClangResult } from "./clang/runner.js";

// Type mapper
export {
  mapType, mapTypeWithBigInt,
  isIntegerType, isUnsignedType, isFloatType, isDoubleType,
  intBitWidth, is64BitType, isPointerType, isReferenceType,
  usesLongDouble, isLongDoubleInLoop
} from "./types/mapper.js";
