export { renderHelp } from "./help.js";
export { runCli } from "./cli.js";
export { HARNESS_VERSION } from "./version.js";
export {
  DEFAULT_CONFIG,
  DEFAULT_ARTIFACT_CONFIG,
  DEFAULT_COMPARISON_MODE,
  DEFAULT_REGRESSION_CONFIG,
  DEFAULT_RUNNER_CONFIG,
  mergeConfig
} from "./config/defaults.js";
export { loadConfig, resolveConfig } from "./config/loader.js";
export { discoverCorpora, expandCorpusFixtureIds } from "./corpora/registry.js";
export {
  discoverFixtures,
  discoverSuites,
  filterFixtures,
  normalizeFixtureId
} from "./fixtures/registry.js";
export { ingestFixture, ingestFixtures } from "./fixtures/ingest.js";
export { createRunWorkspace, pruneWorkspaces } from "./workspace/manager.js";
export { runCommand } from "./command/runner.js";
export { captureGeneratedFiles, captureNamedOutputFiles, captureTextArtifact } from "./artifacts/capture.js";
export { resolveBaselineCommand, runBaseline } from "./runs/baseline.js";
export { resolveTranslatedCommand, runTranslated } from "./runs/translated.js";
export {
  compareExactText,
  compareNormalizedText,
  compareExitCode,
  compareStderr,
  compareExpectedReject,
  compareNumericTolerance,
  compareLineWise,
  compareUnorderedLines,
  compareFileContent,
  compareRegexExpectation,
  compareRuns,
  composeComparisonResults,
  locateFirstDifference
} from "./comparison/core.js";
export {
  classifyCommandFailure,
  classifyComparisonFailure,
  classifyConfigurationError,
  classifyFixtureFailure
} from "./classification/core.js";
export {
  buildCacheKeyRecord,
  computeCacheKey,
  detectCacheStatus,
  summarizeCacheStatuses
} from "./cache/core.js";
export { attachRegressionRecords, detectFixtureRegressions } from "./regressions/core.js";
export { loadPreviousRunCandidates, selectPreviousRun } from "./regressions/lookup.js";
export {
  deserializeRunResult,
  loadRunResult,
  loadSummaryIndex,
  persistRunResult,
  persistSummaryIndex,
  serializeRunResult,
  updateSummaryIndex
} from "./results/store.js";
export { renderFixtureList, renderFixtureResult, renderRunSummary } from "./reporting/text.js";
export { renderRunReportJson } from "./reporting/json.js";
export { renderFixtureResultHtml, renderRunSummaryHtml, writeHtmlReport } from "./reporting/html.js";
export { mapRunResultToExitCode, renderCiSummary } from "./ci/summary.js";
export { renderBenchmarkSummary } from "./benchmark/summary.js";
export { executeRun } from "./app/run.js";
export {
  BROWSER_EVENT_KINDS,
  BROWSER_LAUNCHER_TERMINAL_STATES,
  BROWSER_TERMINAL_EVENT_KINDS,
  DEFAULT_BROWSER_CLEANUP_ACTIONS,
  isBrowserLauncherTerminalState,
  isBrowserTerminalEvent,
  isValidBrowserLauncherTransition
} from "./browser/types.js";
export { BrowserLifecycleRecorder } from "./browser/launcher.js";
export { LocalBrowserLauncher } from "./browser/local-launcher.js";
export { runBrowser } from "./runs/browser.js";
export { BrowserLauncherLoadError, loadBrowserLauncher } from "./browser/loader.js";
export type {
  BrowserLauncher,
  BrowserLaunchSession,
  BrowserSessionAbortReason
} from "./browser/launcher.js";
export type {
  LocalBrowserLauncherOptions,
  LocalBrowserScriptStep
} from "./browser/local-launcher.js";
export type { RunBrowserOptions } from "./runs/browser.js";
export type {
  ArtifactConfig,
  ComparisonMode,
  ConfigLoadResult,
  CorpusConfig,
  FixtureConfig,
  RegressionConfig,
  RejectStage,
  RunnerConfig,
  SuiteConfig,
  ValidationHarnessConfig,
  ValidationHarnessConfigInput
} from "./config/types.js";
export { ConfigValidationError, validateConfig } from "./config/validation.js";
export { FixtureValidationError } from "./fixtures/errors.js";
export type {
  FixtureDiscoveryOptions,
  FixtureMetadata,
  FixtureRecord,
  FixtureSelection,
  FixtureSourceFile,
  IngestedFixture,
  SuiteRecord
} from "./fixtures/types.js";
export type { RunWorkspace, WorkspacePolicy } from "./workspace/types.js";
export type { CommandFailureKind, CommandInvocation, CommandRunResult } from "./command/types.js";
export type { ArtifactKind, ArtifactRecord } from "./artifacts/types.js";
export type { BaselineRunResult, TranslatedRunResult } from "./runs/types.js";
export type { ComparisonCheckResult, ComparisonResult, TextDifference } from "./comparison/types.js";
export type {
  FailureCategory,
  FixtureResultRecord,
  HarnessRunResult,
  RegressionRecord,
  RegressionStatus,
  RunSummaryIndexEntry
} from "./results/types.js";
export type { CorpusRecord } from "./corpora/types.js";
export type { PreviousRunLookup } from "./regressions/types.js";
export type { CacheKeyRecord } from "./cache/core.js";
export type {
  BrowserCleanupAction,
  BrowserCleanupActionKind,
  BrowserDoneEvent,
  BrowserErrorEvent,
  BrowserEvent,
  BrowserEventKind,
  BrowserExecutionMode,
  BrowserFailEvent,
  BrowserLaunchRequest,
  BrowserLauncherLifecycleState,
  BrowserLifecycleTraceEntry,
  BrowserLogEvent,
  BrowserLogLevel,
  BrowserPassEvent,
  BrowserReadyEvent,
  BrowserRunOutcome,
  BrowserRunResult
} from "./browser/types.js";
