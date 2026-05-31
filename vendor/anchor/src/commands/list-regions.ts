import { resolve } from "node:path";

import type { CliResult } from "../cli.js";
import { AnchorError } from "../errors.js";
import { SourceMapIndex } from "../lookup/index.js";
import { loadSourceMap } from "../persistence/store.js";

export async function handleListRegions(argv: string[]): Promise<CliResult> {
  let inputPath: string | undefined;
  let format: "text" | "json" = "text";

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === "--format") {
      const next = argv[++i];
      if (next !== "text" && next !== "json") {
        return { exitCode: 1, output: "anchor list-regions: --format must be 'text' or 'json'" };
      }
      format = next; continue;
    }
    if (arg.startsWith("-")) {
      return { exitCode: 1, output: `anchor list-regions: unknown flag '${arg}'` };
    }
    if (inputPath === undefined) { inputPath = arg; continue; }
    return { exitCode: 1, output: `anchor list-regions: unexpected argument '${arg}'` };
  }

  if (inputPath === undefined) {
    return { exitCode: 1, output: "anchor list-regions: missing required <map> argument" };
  }

  try {
    const map = loadSourceMap(resolve(inputPath));
    const idx = new SourceMapIndex(map);

    if (format === "json") {
      const rows = map.mappings.map((e) => ({
        regionId: e.regionId,
        kind: e.kind,
        sourceFile: e.sourceFile.path,
        sourceLine: e.sourceRange.start.line
      }));
      return { exitCode: 0, output: JSON.stringify(rows, null, 2) };
    }

    if (map.mappings.length === 0) {
      return { exitCode: 0, output: "(no regions)" };
    }
    const lines = map.mappings.map((e) =>
      `${e.regionId}  ${e.kind.padEnd(14)}  ${e.sourceFile.path}:${e.sourceRange.start.line}`
    );
    return { exitCode: 0, output: lines.join("\n") };
  } catch (error) {
    if (error instanceof AnchorError || error instanceof Error) {
      return { exitCode: 1, output: `anchor list-regions: ${error.message}` };
    }
    throw error;
  }
}
