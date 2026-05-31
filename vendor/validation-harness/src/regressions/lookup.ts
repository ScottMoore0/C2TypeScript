import { loadRunResult, loadSummaryIndex } from "../results/store.js";
import type { HarnessRunResult } from "../results/types.js";
import type { PreviousRunLookup } from "./types.js";

export function loadPreviousRunCandidates(resultsDir: string, currentRunId?: string): PreviousRunLookup[] {
  return loadSummaryIndex(resultsDir)
    .filter((entry) => entry.runId !== currentRunId)
    .map((entry) => ({
      runId: entry.runId,
      resultPath: entry.resultPath
    }));
}

export function selectPreviousRun(resultsDir: string, currentRunId?: string): HarnessRunResult | undefined {
  const candidate = loadPreviousRunCandidates(resultsDir, currentRunId)[0];
  if (!candidate) {
    return undefined;
  }
  return loadRunResult(candidate.resultPath);
}
