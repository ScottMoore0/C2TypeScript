import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import { COMPILE_DB_SEARCH_LOCATIONS } from "../adapters/priority.js";
import { canonicalizePath } from "../canonical/paths.js";
import type { CliResult } from "../cli.js";
import { CompileCommandError, DossierError } from "../errors.js";
import { ingestCompileDatabase } from "../ingest/compile-db.js";
import { persistBuildContext } from "../persistence/store.js";

// Handler for `compile-db ingest <path> [--output <path>] [--variant-label <label>] [--project-root <path>]`.
//
// Resolution rules for the positional argument:
//   - If `<path>` is a file (ends in .json or otherwise), it is treated as
//     the compile_commands.json file directly.
//   - If `<path>` is a directory, Dossier searches for a compile database
//     in the project root and common CMake build subdirectories (see
//     COMPILE_DB_SEARCH_LOCATIONS in adapters/priority.ts).
//
// The default output path is `<project-root>/build-context.json`.

export async function handleIngest(argv: string[]): Promise<CliResult> {
  let inputPath: string | undefined;
  let outputPath: string | undefined;
  let variantLabel: string | undefined;
  let projectRootOverride: string | undefined;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === "--output" || arg === "-o") {
      const next = argv[++i];
      if (next === undefined) {
        return { exitCode: 1, output: "compile-db ingest: --output requires a path" };
      }
      outputPath = next;
      continue;
    }
    if (arg === "--variant-label") {
      const next = argv[++i];
      if (next === undefined) {
        return { exitCode: 1, output: "compile-db ingest: --variant-label requires a value" };
      }
      variantLabel = next;
      continue;
    }
    if (arg === "--project-root") {
      const next = argv[++i];
      if (next === undefined) {
        return { exitCode: 1, output: "compile-db ingest: --project-root requires a path" };
      }
      projectRootOverride = next;
      continue;
    }
    if (arg.startsWith("-")) {
      return { exitCode: 1, output: `compile-db ingest: unknown flag '${arg}'` };
    }
    if (inputPath === undefined) {
      inputPath = arg;
      continue;
    }
    return {
      exitCode: 1,
      output: `compile-db ingest: unexpected positional argument '${arg}'`
    };
  }

  if (inputPath === undefined) {
    return {
      exitCode: 1,
      output: "compile-db ingest: missing required <path> argument"
    };
  }

  try {
    const resolvedInput = resolve(inputPath);

    if (!existsSync(resolvedInput)) {
      return {
        exitCode: 1,
        output: `compile-db ingest: path does not exist: ${inputPath}`
      };
    }

    let compileDbPath: string;
    let resolvedProjectRoot: string;

    if (statSync(resolvedInput).isFile()) {
      compileDbPath = resolvedInput;
      resolvedProjectRoot = projectRootOverride
        ? resolve(projectRootOverride)
        : dirname(resolvedInput);
    } else {
      const candidates = COMPILE_DB_SEARCH_LOCATIONS.map((loc) =>
        join(resolvedInput, loc)
      );
      const found = candidates.find((p) => existsSync(p));
      if (!found) {
        return {
          exitCode: 1,
          output: `compile-db ingest: no compile_commands.json found in ${inputPath} or its common build subdirectories`
        };
      }
      compileDbPath = found;
      resolvedProjectRoot = projectRootOverride
        ? resolve(projectRootOverride)
        : resolvedInput;
    }

    const jsonText = readFileSync(compileDbPath, "utf8");
    const context = ingestCompileDatabase({
      jsonText,
      projectRoot: resolvedProjectRoot,
      variantLabel
    });

    const finalOutputPath = outputPath
      ? resolve(outputPath)
      : join(resolvedProjectRoot, "build-context.json");

    persistBuildContext(context, finalOutputPath);

    const tuCount = context.translationUnits.length;
    const unit = tuCount === 1 ? "translation unit" : "translation units";
    const canonicalOutput = canonicalizePath(finalOutputPath);
    return {
      exitCode: 0,
      output: `Ingested ${tuCount} ${unit} -> ${canonicalOutput}`
    };
  } catch (error) {
    if (
      error instanceof CompileCommandError ||
      error instanceof DossierError
    ) {
      return { exitCode: 1, output: `compile-db ingest: ${error.message}` };
    }
    throw error;
  }
}
