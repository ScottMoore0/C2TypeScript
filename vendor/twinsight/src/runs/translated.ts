import { join } from "node:path";

import { captureGeneratedFiles, captureNamedOutputFiles, captureTextArtifact } from "../artifacts/capture.js";
import type { ArtifactConfig, RunnerConfig } from "../config/types.js";
import { runCommand } from "../command/runner.js";
import type { FixtureRecord } from "../fixtures/types.js";
import type { RunWorkspace } from "../workspace/types.js";
import type { TranslatedRunResult } from "./types.js";

export function resolveTranslatedCommand(fixture: FixtureRecord, runners: RunnerConfig): string {
  const resolved = fixture.translatedCommand ?? runners.translatedCommand;
  if (!resolved) {
    throw new Error(`No translated command configured for fixture ${fixture.id}`);
  }
  return resolved;
}

export async function runTranslated(options: {
  fixture: FixtureRecord;
  workspace: RunWorkspace;
  runners: RunnerConfig;
  artifacts: ArtifactConfig;
}): Promise<TranslatedRunResult> {
  const command = resolveTranslatedCommand(options.fixture, options.runners);
  const commandResult = await runCommand({
    command,
    shell: options.runners.shell,
    cwd: options.workspace.fixtureDir,
    env: { ...options.runners.env, ...options.fixture.env },
    timeoutMs: options.fixture.timeoutMs ?? options.runners.timeoutMs
  });

  const stdoutArtifact = captureTextArtifact({
    targetDir: options.workspace.translatedArtifactsDir,
    filename: "stdout.txt",
    contents: commandResult.stdout,
    kind: "translated-stdout",
    label: "translated stdout",
    retention: options.artifacts.retention,
    ok: commandResult.ok
  });

  const stderrArtifact = captureTextArtifact({
    targetDir: options.workspace.translatedArtifactsDir,
    filename: "stderr.txt",
    contents: commandResult.stderr,
    kind: "translated-stderr",
    label: "translated stderr",
    retention: options.artifacts.retention,
    ok: commandResult.ok
  });

  const generatedArtifacts = captureGeneratedFiles({
    workspace: options.workspace,
    targetDir: join(options.workspace.translatedArtifactsDir, "generated"),
    patterns: options.fixture.generatedFileGlobs,
    retention: options.artifacts.retention,
    ok: commandResult.ok
  });

  const outputArtifacts = captureNamedOutputFiles({
    workspace: options.workspace,
    targetDir: join(options.workspace.translatedArtifactsDir, "outputs"),
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
    kind: "translated",
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
