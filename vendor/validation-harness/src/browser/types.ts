import type { ArtifactRecord } from "../artifacts/types.js";

// CH-16: Launcher lifecycle states.
export type BrowserLauncherLifecycleState =
  | "created"
  | "launching"
  | "running"
  | "completed"
  | "failed"
  | "timed-out"
  | "cleaned-up";

export const BROWSER_LAUNCHER_TERMINAL_STATES: readonly BrowserLauncherLifecycleState[] = [
  "completed",
  "failed",
  "timed-out"
] as const;

export function isBrowserLauncherTerminalState(state: BrowserLauncherLifecycleState): boolean {
  return (BROWSER_LAUNCHER_TERMINAL_STATES as readonly string[]).includes(state);
}

const BROWSER_LAUNCHER_TRANSITIONS: Record<BrowserLauncherLifecycleState, readonly BrowserLauncherLifecycleState[]> = {
  created: ["launching", "failed"],
  launching: ["running", "failed", "timed-out"],
  running: ["completed", "failed", "timed-out"],
  completed: ["cleaned-up"],
  failed: ["cleaned-up"],
  "timed-out": ["cleaned-up"],
  "cleaned-up": []
};

export function isValidBrowserLauncherTransition(
  from: BrowserLauncherLifecycleState,
  to: BrowserLauncherLifecycleState
): boolean {
  return BROWSER_LAUNCHER_TRANSITIONS[from].includes(to);
}

// CH-14: Browser launch request contract. Transport-agnostic.
export type BrowserExecutionMode = "headless" | "headed";

export interface BrowserLaunchRequest {
  fixtureId: string;
  workspaceDir: string;
  timeoutMs: number;
  executionMode: BrowserExecutionMode;
}

// CH-15: Browser signaling event contract.
export type BrowserEventKind = "ready" | "log" | "pass" | "fail" | "error" | "done";

export const BROWSER_EVENT_KINDS: readonly BrowserEventKind[] = [
  "ready",
  "log",
  "pass",
  "fail",
  "error",
  "done"
] as const;

export const BROWSER_TERMINAL_EVENT_KINDS: readonly BrowserEventKind[] = [
  "pass",
  "fail",
  "error",
  "done"
] as const;

export function isBrowserTerminalEvent(kind: BrowserEventKind): boolean {
  return (BROWSER_TERMINAL_EVENT_KINDS as readonly string[]).includes(kind);
}

export type BrowserLogLevel = "debug" | "info" | "warn" | "error";

export interface BrowserReadyEvent {
  kind: "ready";
  timestampMs: number;
}

export interface BrowserLogEvent {
  kind: "log";
  timestampMs: number;
  level: BrowserLogLevel;
  message: string;
}

export interface BrowserPassEvent {
  kind: "pass";
  timestampMs: number;
}

export interface BrowserFailEvent {
  kind: "fail";
  timestampMs: number;
  message: string;
}

export interface BrowserErrorEvent {
  kind: "error";
  timestampMs: number;
  message: string;
  stack?: string;
}

export interface BrowserDoneEvent {
  kind: "done";
  timestampMs: number;
}

export type BrowserEvent =
  | BrowserReadyEvent
  | BrowserLogEvent
  | BrowserPassEvent
  | BrowserFailEvent
  | BrowserErrorEvent
  | BrowserDoneEvent;

// CH-17: Timeout and cleanup contract.
export type BrowserCleanupActionKind =
  | "close-page"
  | "close-context"
  | "release-workspace"
  | "emit-cleanup-event";

export interface BrowserCleanupAction {
  kind: BrowserCleanupActionKind;
  order: number;
}

export const DEFAULT_BROWSER_CLEANUP_ACTIONS: readonly BrowserCleanupAction[] = [
  { kind: "close-page", order: 0 },
  { kind: "close-context", order: 1 },
  { kind: "release-workspace", order: 2 },
  { kind: "emit-cleanup-event", order: 3 }
] as const;

// CH-13: Browser-run result contract. Additive to the top-level result shape;
// browser-specific fields live here while artifacts reuse ArtifactRecord.
export type BrowserRunOutcome = "pass" | "fail" | "error" | "timed-out";

export interface BrowserLifecycleTraceEntry {
  state: BrowserLauncherLifecycleState;
  atMs: number;
}

export interface BrowserRunResult {
  kind: "browser";
  fixtureId: string;
  launchRequest: BrowserLaunchRequest;
  lifecycleTrace: BrowserLifecycleTraceEntry[];
  events: BrowserEvent[];
  logArtifact?: ArtifactRecord;
  artifacts: ArtifactRecord[];
  outcome: BrowserRunOutcome;
  durationMs: number;
  timedOut: boolean;
  success: boolean;
}
