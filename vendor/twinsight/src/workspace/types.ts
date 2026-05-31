import type { FixtureRecord } from "../fixtures/types.js";

export interface RunWorkspace {
  runId: string;
  rootDir: string;
  fixtureDir: string;
  artifactsDir: string;
  baselineArtifactsDir: string;
  translatedArtifactsDir: string;
  browserArtifactsDir: string;
  metadataPath: string;
  fixture: FixtureRecord;
}

export interface WorkspacePolicy {
  keepRuns?: number;
}
