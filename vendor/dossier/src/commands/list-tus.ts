import { resolve } from "node:path";

import type { CliResult } from "../cli.js";
import { DossierError } from "../errors.js";
import { loadBuildContext } from "../persistence/store.js";

// Handler for `dossier list-tus <path> [--format text|json]`.

type ListFormat = "text" | "json";

export async function handleListTus(argv: string[]): Promise<CliResult> {
  let inputPath: string | undefined;
  let format: ListFormat = "text";

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === "--format") {
      const next = argv[++i];
      if (next !== "text" && next !== "json") {
        return {
          exitCode: 1,
          output: "dossier list-tus: --format must be 'text' or 'json'"
        };
      }
      format = next;
      continue;
    }
    if (arg.startsWith("-")) {
      return { exitCode: 1, output: `dossier list-tus: unknown flag '${arg}'` };
    }
    if (inputPath === undefined) {
      inputPath = arg;
      continue;
    }
    return {
      exitCode: 1,
      output: `dossier list-tus: unexpected argument '${arg}'`
    };
  }

  if (inputPath === undefined) {
    return {
      exitCode: 1,
      output: "dossier list-tus: missing required <path> argument"
    };
  }

  try {
    const context = loadBuildContext(resolve(inputPath));
    if (format === "json") {
      const rows = context.translationUnits.map((tu) => ({
        sourceFile: tu.sourceFile,
        tuId: tu.tuId
      }));
      return { exitCode: 0, output: JSON.stringify(rows, null, 2) };
    }
    if (context.translationUnits.length === 0) {
      return { exitCode: 0, output: "(no translation units)" };
    }
    const lines = context.translationUnits.map(
      (tu) => `${tu.tuId}  ${tu.sourceFile}`
    );
    return { exitCode: 0, output: lines.join("\n") };
  } catch (error) {
    if (error instanceof DossierError) {
      return { exitCode: 1, output: `dossier list-tus: ${error.message}` };
    }
    throw error;
  }
}
