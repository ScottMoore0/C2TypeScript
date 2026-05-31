import { resolve } from "node:path";

import type { CliResult } from "../cli.js";
import { AnchorError } from "../errors.js";
import { SourceMapIndex } from "../lookup/index.js";
import { loadSourceMap } from "../persistence/store.js";

export async function handleInspect(argv: string[]): Promise<CliResult> {
  let inputPath: string | undefined;
  for (const arg of argv) {
    if (arg.startsWith("-")) {
      return { exitCode: 1, output: `source-mapping inspect: unknown flag '${arg}'` };
    }
    if (inputPath === undefined) { inputPath = arg; continue; }
    return { exitCode: 1, output: `source-mapping inspect: unexpected argument '${arg}'` };
  }
  if (inputPath === undefined) {
    return { exitCode: 1, output: "source-mapping inspect: missing required <map> argument" };
  }
  try {
    const map = loadSourceMap(resolve(inputPath));
    const idx = new SourceMapIndex(map);
    const kindCounts: Record<string, number> = {};
    for (const entry of map.mappings) {
      kindCounts[entry.kind] = (kindCounts[entry.kind] ?? 0) + 1;
    }
    const lines = [
      `Source map: ${inputPath}`,
      `  schemaVersion: ${map.schemaVersion}`,
      `  generator: ${map.generator.name} ${map.generator.version}`,
      `  generatedAt: ${map.generatedAt}`,
      `  mappings: ${map.mappings.length}`,
      `  regions: ${idx.regionIds().length}`,
      `  source files: ${idx.sourceFiles().length}`,
      `  target files: ${idx.targetFiles().length}`,
      `  diagnostics: ${map.diagnostics.length}`,
      ""
    ];
    if (Object.keys(kindCounts).length > 0) {
      lines.push("Construct kinds:");
      for (const [kind, count] of Object.entries(kindCounts).sort()) {
        lines.push(`  ${kind}: ${count}`);
      }
    }
    return { exitCode: 0, output: lines.join("\n") };
  } catch (error) {
    if (error instanceof AnchorError || error instanceof Error) {
      return { exitCode: 1, output: `source-mapping inspect: ${error.message}` };
    }
    throw error;
  }
}
