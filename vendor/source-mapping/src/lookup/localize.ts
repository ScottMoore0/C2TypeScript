import { readFileSync } from "node:fs";

import type { MappingEntry } from "../schema/mapping-entry.js";
import type { Position } from "../schema/position.js";
import type { SourceMap } from "../schema/source-map.js";
import { SourceMapIndex } from "./index.js";

// A-8: Failure localization.
//
// Given a target position (e.g. from a runtime stack trace), walk the map
// back to the originating source location and return a structured record
// that humans and LLMs can both consume.

export interface LocalizedFailure {
  targetFile: string;
  targetPosition: Position;
  mapping: MappingEntry | undefined;
  sourceFile: string | undefined;
  sourceLine: number | undefined;
  sourceColumn: number | undefined;
  constructKind: string | undefined;
  contextWindow: string[] | undefined;
}

export function localizeFailure(
  map: SourceMap,
  targetFile: string,
  targetPosition: Position,
  contextRadius: number = 3
): LocalizedFailure {
  const idx = new SourceMapIndex(map);
  const mapping = idx.mostSpecificAtTarget(targetFile, targetPosition);

  if (mapping === undefined) {
    return {
      targetFile,
      targetPosition,
      mapping: undefined,
      sourceFile: undefined,
      sourceLine: undefined,
      sourceColumn: undefined,
      constructKind: undefined,
      contextWindow: undefined
    };
  }

  const sourceFile = mapping.sourceFile.path;
  const sourceLine = mapping.sourceRange.start.line;
  const sourceColumn = mapping.sourceRange.start.column;
  const constructKind = mapping.kind;

  let contextWindow: string[] | undefined;
  try {
    contextWindow = readContextWindow(
      sourceFile,
      sourceLine,
      contextRadius
    );
  } catch {
    contextWindow = undefined;
  }

  return {
    targetFile,
    targetPosition,
    mapping,
    sourceFile,
    sourceLine,
    sourceColumn,
    constructKind,
    contextWindow
  };
}

export function readContextWindow(
  filePath: string,
  centerLine: number,
  radius: number
): string[] {
  const content = readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);
  const start = Math.max(0, centerLine - 1 - radius);
  const end = Math.min(lines.length, centerLine - 1 + radius + 1);
  return lines.slice(start, end).map(
    (line, idx) =>
      `${String(start + idx + 1).padStart(5)} | ${line}`
  );
}

export function formatLocalizedFailure(failure: LocalizedFailure): string {
  if (failure.mapping === undefined) {
    return `${failure.targetFile}:${failure.targetPosition.line}:${failure.targetPosition.column} (unmapped)`;
  }
  const location = `${failure.sourceFile}:${failure.sourceLine}:${failure.sourceColumn}`;
  const kind = failure.constructKind ? ` in ${failure.constructKind}` : "";
  const lines = [`${location}${kind}`];
  if (failure.contextWindow !== undefined) {
    lines.push("");
    for (const line of failure.contextWindow) {
      lines.push(line);
    }
  }
  return lines.join("\n");
}
