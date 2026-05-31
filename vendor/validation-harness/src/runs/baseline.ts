import { join } from "node:path";

import { captureGeneratedFiles, captureNamedOutputFiles, captureTextArtifact } from "../artifacts/capture.js";
import type { ArtifactConfig, RunnerConfig } from "../config/types.js";
import { runCommand } from "../command/runner.js";
import type { FixtureRecord } from "../fixtures/types.js";
import type { RunWorkspace } from "../workspace/types.js";
import type { BaselineRunResult } from "./types.js";

export function resolveBaselineCommand(fixture: FixtureRecord, runners: RunnerConfig): string {
  const resolved = fixture.baselineCommand ?? runners.baselineCommand;
  if (!resolved) {
    throw new Error(`No baseline command configured for fixture ${fixture.id}`);
  }
  return resolved;
}

export async function runBaseline(options: {
  fixture: FixtureRecord;
  workspace: RunWorkspace;
  runners: RunnerConfig;
  artifacts: ArtifactConfig;
}): Promise<BaselineRunResult> {
  const command = resolveBaselineCommand(options.fixture, options.runners);
  const commandResult = await runCommand({
    command,
    shell: options.runners.shell,
    cwd: options.workspace.fixtureDir,
    env: { ...options.runners.env, ...options.fixture.env },
    timeoutMs: options.fixture.timeoutMs ?? options.runners.timeoutMs
  });

  const stdoutArtifact = captureTextArtifact({
    targetDir: options.workspace.baselineArtifactsDir,
    filename: "stdout.txt",
    contents: commandResult.stdout,
    kind: "baseline-stdout",
    label: "baseline stdout",
    retention: options.artifacts.retention,
    ok: commandResult.ok
  });

  const stderrArtifact = captureTextArtifact({
    targetDir: options.workspace.baselineArtifactsDir,
    filename: "stderr.txt",
    contents: commandResult.stderr,
    kind: "baseline-stderr",
    label: "baseline stderr",
    retention: options.artifacts.retention,
    ok: commandResult.ok
  });

  const generatedArtifacts = captureGeneratedFiles({
    workspace: options.workspace,
    targetDir: join(options.workspace.baselineArtifactsDir, "generated"),
    patterns: options.fixture.generatedFileGlobs,
    retention: options.artifacts.retention,
    ok: commandResult.ok
  });

  const outputArtifacts = captureNamedOutputFiles({
    workspace: options.workspace,
    targetDir: join(options.workspace.baselineArtifactsDir, "outputs"),
    filePaths: options.fixture.outputFiles,
    retention: options.artifacts.retention,
    ok: commandResult.ok
  });

  const artifacts = [
    ...(stdoutArtifact ? [stdoutArtifact] : []),
    ...(stderrArtifact ? [stderrArtifact] : []),
    ...generatedArtifacts,
    ...outputArtifacts
  ];

  return {
    kind: "baseline",
    fixtureId: options.fixture.id,
    command,
    commandResult,
    stdoutArtifact,
    stderrArtifact,
    generatedArtifacts,
    outputArtifacts,
    artifacts,
    success: commandResult.ok
  };
}
