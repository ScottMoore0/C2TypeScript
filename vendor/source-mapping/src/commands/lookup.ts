import { resolve } from "node:path";

import type { CliResult } from "../cli.js";
import { AnchorError } from "../errors.js";
import { SourceMapIndex } from "../lookup/index.js";
import { formatLocalizedFailure, localizeFailure } from "../lookup/localize.js";
import { makePosition } from "../schema/position.js";
import { loadSourceMap } from "../persistence/store.js";

// Parse `file:line:col` into components.
function parseFileLineCol(spec: string): { file: string; line: number; column: number } | null {
  const lastColon = spec.lastIndexOf(":");
  if (lastColon < 0) return null;
  const beforeLastColon = spec.slice(0, lastColon);
  const secondLastColon = beforeLastColon.lastIndexOf(":");
  if (secondLastColon < 0) return null;

  const file = spec.slice(0, secondLastColon);
  const line = Number(spec.slice(secondLastColon + 1, lastColon));
  const column = Number(spec.slice(lastColon + 1));
  if (!Number.isInteger(line) || !Number.isInteger(column) || line < 1 || column < 1) return null;
  if (file.length === 0) return null;
  return { file, line, column };
}

export async function handleLookup(argv: string[]): Promise<CliResult> {
  let inputPath: string | undefined;
  let targetSpec: string | undefined;
  let sourceSpec: string | undefined;
  let regionId: string | undefined;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === "--target") { targetSpec = argv[++i]; continue; }
    if (arg === "--source") { sourceSpec = argv[++i]; continue; }
    if (arg === "--region") { regionId = argv[++i]; continue; }
    if (arg.startsWith("-")) {
      return { exitCode: 1, output: `source-mapping lookup: unknown flag '${arg}'` };
    }
    if (inputPath === undefined) { inputPath = arg; continue; }
    return { exitCode: 1, output: `source-mapping lookup: unexpected argument '${arg}'` };
  }

  if (inputPath === undefined) {
    return { exitCode: 1, output: "source-mapping lookup: missing required <map> argument" };
  }

  const modes = [targetSpec, sourceSpec, regionId].filter(Boolean).length;
  if (modes === 0) {
    return { exitCode: 1, output: "source-mapping lookup: specify --target, --source, or --region" };
  }
  if (modes > 1) {
    return { exitCode: 1, output: "source-mapping lookup: specify only one of --target, --source, or --region" };
  }

  try {
    const map = loadSourceMap(resolve(inputPath));
    const idx = new SourceMapIndex(map);

    if (regionId !== undefined) {
      const entry = idx.lookupByRegionId(regionId);
      if (entry === undefined) {
        return { exitCode: 1, output: `source-mapping lookup: region '${regionId}' not found` };
      }
      return {
        exitCode: 0,
        output: [
          `region: ${entry.regionId}`,
          `kind: ${entry.kind}`,
          `source: ${entry.sourceFile.path}:${entry.sourceRange.start.line}:${entry.sourceRange.start.column}`,
          `target: ${entry.targetFile.path}:${entry.targetRange.start.line}:${entry.targetRange.start.column}`
        ].join("\n")
      };
    }

    if (targetSpec !== undefined) {
      const parsed = parseFileLineCol(targetSpec);
      if (parsed === null) {
        return { exitCode: 1, output: `source-mapping lookup: invalid --target format, expected file:line:col` };
      }
      // We don't have byteOffset from the CLI; use 0 as placeholder and match by line/col.
      // A proper implementation would compute byteOffset from the file content.
      const pos = makePosition(parsed.line, parsed.column, 0);
      const result = localizeFailure(map, parsed.file, pos);
      return { exitCode: 0, output: formatLocalizedFailure(result) };
    }

    if (sourceSpec !== undefined) {
      const parsed = parseFileLineCol(sourceSpec);
      if (parsed === null) {
        return { exitCode: 1, output: `source-mapping lookup: invalid --source format, expected file:line:col` };
      }
      const pos = makePosition(parsed.line, parsed.column, 0);
      const results = idx.lookupBySourcePosition(parsed.file, pos);
      if (results.length === 0) {
        return { exitCode: 0, output: "(no mappings found for this source position)" };
      }
      const lines = results.map((e) =>
        `${e.targetFile.path}:${e.targetRange.start.line}:${e.targetRange.start.column}  [${e.kind}]  region=${e.regionId}`
      );
      return { exitCode: 0, output: lines.join("\n") };
    }

    return { exitCode: 1, output: "source-mapping lookup: internal error" };
  } catch (error) {
    if (error instanceof AnchorError || error instanceof Error) {
      return { exitCode: 1, output: `source-mapping lookup: ${error.message}` };
    }
    throw error;
  }
}
