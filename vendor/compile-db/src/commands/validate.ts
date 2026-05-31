import { resolve } from "node:path";

import type { CliResult } from "../cli.js";
import { DossierError } from "../errors.js";
import { loadBuildContext } from "../persistence/store.js";

// Handler for `compile-db validate <path>`.
//
// Loads a stored BuildContext and validates its top-level shape. Prints a
// short summary on success; exits 1 with a clear message on failure.

export async function handleValidate(argv: string[]): Promise<CliResult> {
  let inputPath: string | undefined;

  for (const arg of argv) {
    if (arg.startsWith("-")) {
      return { exitCode: 1, output: `compile-db validate: unknown flag '${arg}'` };
    }
    if (inputPath === undefined) {
      inputPath = arg;
      continue;
    }
    return {
      exitCode: 1,
      output: `compile-db validate: unexpected argument '${arg}'`
    };
  }

  if (inputPath === undefined) {
    return {
      exitCode: 1,
      output: "compile-db validate: missing required <path> argument"
    };
  }

  try {
    const context = loadBuildContext(resolve(inputPath));
    const summary = [
      `Valid build context`,
      `  schemaVersion: ${context.schemaVersion}`,
      `  adapter: ${context.adapter}`,
      `  projectRoot: ${context.projectRoot}`,
      `  translationUnits: ${context.translationUnits.length}`,
      `  compilers: ${context.compilers.length}`,
      `  diagnostics: ${context.diagnostics.length}`
    ].join("\n");
    return { exitCode: 0, output: summary };
  } catch (error) {
    if (error instanceof DossierError) {
      return { exitCode: 1, output: `compile-db validate: ${error.message}` };
    }
    if (error instanceof Error && "code" in error) {
      return {
        exitCode: 1,
        output: `compile-db validate: ${(error as Error).message}`
      };
    }
    throw error;
  }
}
