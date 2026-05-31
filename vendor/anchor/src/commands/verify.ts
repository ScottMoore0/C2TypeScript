import { resolve } from "node:path";

import type { CliResult } from "../cli.js";
import { AnchorError } from "../errors.js";
import { loadSourceMap } from "../persistence/store.js";

export async function handleVerify(argv: string[]): Promise<CliResult> {
  let inputPath: string | undefined;
  for (const arg of argv) {
    if (arg.startsWith("-")) {
      return { exitCode: 1, output: `anchor verify: unknown flag '${arg}'` };
    }
    if (inputPath === undefined) { inputPath = arg; continue; }
    return { exitCode: 1, output: `anchor verify: unexpected argument '${arg}'` };
  }
  if (inputPath === undefined) {
    return { exitCode: 1, output: "anchor verify: missing required <map> argument" };
  }
  try {
    const map = loadSourceMap(resolve(inputPath));
    return {
      exitCode: 0,
      output: [
        "Valid source map",
        `  schemaVersion: ${map.schemaVersion}`,
        `  generator: ${map.generator.name} ${map.generator.version}`,
        `  mappings: ${map.mappings.length}`,
        `  diagnostics: ${map.diagnostics.length}`
      ].join("\n")
    };
  } catch (error) {
    if (error instanceof AnchorError) {
      return { exitCode: 1, output: `anchor verify: ${error.message}` };
    }
    if (error instanceof Error) {
      return { exitCode: 1, output: `anchor verify: ${error.message}` };
    }
    throw error;
  }
}
