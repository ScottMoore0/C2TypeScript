import { createHash } from "node:crypto";

import type { FixtureRecord } from "../fixtures/types.js";
import type { FixtureResultRecord, HarnessRunResult } from "../results/types.js";
import type { ArtifactConfig, RunnerConfig } from "../config/types.js";

export interface CacheKeyRecord {
  fixtureId: string;
  comparisonMode: FixtureRecord["comparisonMode"];
  timeoutMs: number;
  baselineCommand: string;
  translatedCommand: string;
  generatedFileGlobs: string[];
  outputFiles: string[];
  runnerShell: boolean;
  artifactRetention: ArtifactConfig["retention"];
}

export function buildCacheKeyRecord(
  fixture: FixtureRecord,
  runners: RunnerConfig,
  artifacts: ArtifactConfig
): CacheKeyRecord {
  return {
    fixtureId: fixture.id,
    comparisonMode: fixture.comparisonMode,
    timeoutMs: fixture.timeoutMs ?? runners.timeoutMs,
    baselineCommand: fixture.baselineCommand ?? runners.baselineCommand ?? "",
    translatedCommand: fixture.translatedCommand ?? runners.translatedCommand ?? "",
    generatedFileGlobs: [...fixture.generatedFileGlobs],
    outputFiles: [...fixture.outputFiles],
    runnerShell: runners.shell,
    artifactRetention: artifacts.retention
  };
}

export function computeCacheKey(record: CacheKeyRecord): string {
  return createHash("sha256").update(JSON.stringify(record)).digest("hex");
}

export function detectCacheStatus(options: {
  currentKey: string;
  previousRun?: HarnessRunResult;
  fixtureId: string;
}): "hit" | "miss" {
  const previousFixture = options.previousRun?.fixtureResults.find((fixture) => fixture.fixtureId === options.fixtureId);
  if (previousFixture?.cacheKey === options.currentKey) {
    return "hit";
  }
  return "miss";
}

export function summarizeCacheStatuses(result: HarnessRunResult): { hit: number; miss: number } {
  return result.fixtureResults.reduce(
    (counts, fixture) => {
      if (fixture.cacheStatus === "hit") {
        counts.hit += 1;
      } else if (fixture.cacheStatus === "miss") {
        counts.miss += 1;
      }
      return counts;
    },
    { hit: 0, miss: 0 }
  );
}
