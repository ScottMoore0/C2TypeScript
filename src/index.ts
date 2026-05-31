/**
 * C2TypeScript — C-to-TypeScript translator.
 *
 * Public programmatic API. Re-exports the C-relevant slice of the upstream
 * compiler, bundled into `vendor/` at publish time.
 *
 * For the CLI entry, see `dist/cli.js` (built from `vendor/compiler/src/cli.ts`).
 */

// C emitter and supporting infrastructure
export { Emitter } from "../vendor/compiler/src/emitter.js";
export type { EmitterOptions } from "../vendor/compiler/src/emitter.js";

// Clang AST frontend
export { dumpAST, parseAST } from "../vendor/compiler/src/clang-runner.js";
export type { ClangResult } from "../vendor/compiler/src/clang-runner.js";

// Type mapping (C → TypeScript primitives)
export {
  mapType,
  isIntegerType,
  isUnsignedType,
  is64BitType,
  intBitWidth,
} from "../vendor/compiler/src/type-mapper.js";

// Project ingestion
export { scanProject } from "../vendor/compiler/src/project-scanner.js";
export type { ProjectInfo, SourceFile, Language } from "../vendor/compiler/src/project-scanner.js";

// Resolution and dependency analysis
export { ImportResolver } from "../vendor/compiler/src/import-resolver.js";

// AST types
export type { ASTNode, QualType } from "../vendor/compiler/src/ast-types.js";
