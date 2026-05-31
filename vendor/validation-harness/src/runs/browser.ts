import { captureTextArtifact } from "../artifacts/capture.js";
import type { ArtifactConfig } from "../config/types.js";
import type {
  BrowserEvent,
  BrowserExecutionMode,
  BrowserLaunchRequest,
  BrowserLifecycleTraceEntry,
  BrowserLogEvent,
  BrowserRunOutcome,
  BrowserRunResult
} from "../browser/types.js";
import type { BrowserLauncher } from "../browser/launcher.js";

export interface RunBrowserOptions {
  fixtureId: string;
  workspaceDir: string;
  browserArtifactsDir: string;
  launcher: BrowserLauncher;
  executionMode: BrowserExecutionMode;
  timeoutMs: number;
  artifactRetention: ArtifactConfig["retention"];
  clock?: () => number;
}

function outcomeFromEvents(events: readonly BrowserEvent[]): BrowserRunOutcome {
  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i];
    if (event.kind === "pass") {
      return "pass";
    }
    if (event.kind === "fail") {
      return "fail";
    }
    if (event.kind === "error") {
      return "error";
    }
    if (event.kind === "done") {
      return "pass";
    }
  }
  return "error";
}

function renderLogArtifactText(logEvents: readonly BrowserLogEvent[]): string {
  if (logEvents.length === 0) {
    return "";
  }
  const lines = logEvents.map(
    (event) => `[${event.timestampMs}] [${event.level}] ${event.message}`
  );
  return `${lines.join("\n")}\n`;
}

function renderEventsArtifactText(events: readonly BrowserEvent[]): string {
  if (events.length === 0) {
    return "";
  }
  const lines = events.map((event) => JSON.stringify(event));
  return `${lines.join("\n")}\n`;
}

export async function runBrowser(options: RunBrowserOptions): Promise<BrowserRunResult> {
  const clock = options.clock ?? (() => Date.now());
  const launchRequest: BrowserLaunchRequest = {
    fixtureId: options.fixtureId,
    workspaceDir: options.workspaceDir,
    timeoutMs: options.timeoutMs,
    executionMode: options.executionMode
  };

  const startedAt = clock();
  const session = await options.launcher.launch(launchRequest);

  const events: BrowserEvent[] = [];
  const removeEventListener = session.onEvent((event) => {
    events.push(event);
  });

  const terminated = new Promise<void>((resolve) => {
    const removeTerminatedListener = session.onTerminated(() => {
      removeTerminatedListener();
      resolve();
    });
  });

  let timedOut = false;
  const timer = new Promise<"timeout">((resolve) => {
    const handle = setTimeout(() => {
      timedOut = true;
      resolve("timeout");
    }, options.timeoutMs);
    if (typeof handle === "object" && handle && typeof (handle as { unref?: () => void }).unref === "function") {
      (handle as { unref: () => void }).unref();
    }
  });

  session.start();

  await Promise.race([
    terminated.then(() => "done" as const),
    timer
  ]);

  removeEventListener();

  if (timedOut) {
    await session.abort("timeout");
  }

  await session.cleanup();

  const endedAt = clock();
  const durationMs = Math.max(0, endedAt - startedAt);

  const logEvents = events.filter((event): event is BrowserLogEvent => event.kind === "log");

  const outcome: BrowserRunOutcome = timedOut ? "timed-out" : outcomeFromEvents(events);
  const success = outcome === "pass";

  const logArtifact = captureTextArtifact({
    targetDir: options.browserArtifactsDir,
    filename: "browser.log",
    contents: renderLogArtifactText(logEvents),
    kind: "browser-log",
    label: "browser log",
    retention: options.artifactRetention,
    ok: success
  });

  const eventsArtifact = captureTextArtifact({
    targetDir: options.browserArtifactsDir,
    filename: "browser-events.ndjson",
    contents: renderEventsArtifactText(events),
    kind: "browser-events",
    label: "browser events",
    retention: options.artifactRetention,
    ok: success
  });

  const artifacts = [
    ...(logArtifact ? [logArtifact] : []),
    ...(eventsArtifact ? [eventsArtifact] : [])
  ];

  const lifecycleTrace: BrowserLifecycleTraceEntry[] = [...session.lifecycleTrace];

  return {
    kind: "browser",
    fixtureId: options.fixtureId,
    launchRequest,
    lifecycleTrace,
    events,
    logArtifact,
    artifacts,
    outcome,
    durationMs,
    timedOut,
    success
  };
}
