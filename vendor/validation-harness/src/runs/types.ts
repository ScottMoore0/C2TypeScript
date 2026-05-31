import type { ArtifactRecord } from "../artifacts/types.js";
import type { CommandRunResult } from "../command/types.js";
import type { FixtureRecord } from "../fixtures/types.js";

export interface BaselineRunResult {
  kind: "baseline";
  fixtureId: string;
  command: string;
  commandResult: CommandRunResult;
  stdoutArtifact?: ArtifactRecord;
  stderrArtifact?: ArtifactRecord;
  generatedArtifacts: ArtifactRecord[];
  outputArtifacts: ArtifactRecord[];
  artifacts: ArtifactRecord[];
  success: boolean;
}

export interface TranslatedRunResult {
  kind: "translated";
  fixtureId: string;
  command: string;
  commandResult: CommandRunResult;
  stdoutArtifact?: ArtifactRecord;
  stderrArtifact?: ArtifactRecord;
  generatedArtifacts: ArtifactRecord[];
  outputArtifacts: ArtifactRecord[];
  artifacts: ArtifactRecord[];
  success: boolean;
}

export interface RunnerDependencies {
  fixture: FixtureRecord;
  workspaceDir: string;
  shell: boolean;
  timeoutMs: number;
  env: Record<string, string>;
}
