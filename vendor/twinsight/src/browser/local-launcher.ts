import { setTimeout as delay } from "node:timers/promises";

import {
  BrowserLifecycleRecorder,
  type BrowserLauncher,
  type BrowserLaunchSession,
  type BrowserSessionAbortReason
} from "./launcher.js";
import {
  isBrowserTerminalEvent,
  type BrowserEvent,
  type BrowserLaunchRequest,
  type BrowserLauncherLifecycleState,
  type BrowserLifecycleTraceEntry
} from "./types.js";

export interface LocalBrowserScriptStep {
  afterMs?: number;
  event: BrowserEvent;
}

export interface LocalBrowserLauncherOptions {
  script: LocalBrowserScriptStep[];
  launchDelayMs?: number;
  failDuringLaunch?: string;
  clock?: () => number;
}

export class LocalBrowserLauncher implements BrowserLauncher {
  constructor(private readonly options: LocalBrowserLauncherOptions) {}

  async launch(_request: BrowserLaunchRequest): Promise<BrowserLaunchSession> {
    const clock = this.options.clock ?? (() => Date.now());
    const recorder = new BrowserLifecycleRecorder(clock);
    return new LocalBrowserSession(this.options, recorder);
  }
}

class LocalBrowserSession implements BrowserLaunchSession {
  private readonly eventListeners = new Set<(event: BrowserEvent) => void>();
  private readonly terminatedListeners = new Set<() => void>();
  private readonly abortController = new AbortController();
  private started = false;
  private terminated = false;
  private reachedTerminalNaturally = false;

  constructor(
    private readonly options: LocalBrowserLauncherOptions,
    private readonly recorder: BrowserLifecycleRecorder
  ) {}

  get state(): BrowserLauncherLifecycleState {
    return this.recorder.state;
  }

  get lifecycleTrace(): readonly BrowserLifecycleTraceEntry[] {
    return this.recorder.trace;
  }

  onEvent(listener: (event: BrowserEvent) => void): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  onTerminated(listener: () => void): () => void {
    this.terminatedListeners.add(listener);
    return () => this.terminatedListeners.delete(listener);
  }

  start(): void {
    if (this.started) {
      return;
    }
    this.started = true;
    void this.run();
  }

  private async run(): Promise<void> {
    try {
      this.recorder.transition("launching");
    } catch {
      return;
    }

    if (this.options.failDuringLaunch) {
      try {
        this.recorder.transition("failed");
      } catch {}
      this.notifyTerminated();
      return;
    }

    if (this.options.launchDelayMs && this.options.launchDelayMs > 0) {
      try {
        await delay(this.options.launchDelayMs, undefined, {
          signal: this.abortController.signal
        });
      } catch {
        return;
      }
    }

    if (this.abortController.signal.aborted) {
      return;
    }

    try {
      this.recorder.transition("running");
    } catch {
      return;
    }

    for (const step of this.options.script) {
      if (this.abortController.signal.aborted) {
        return;
      }
      if (step.afterMs && step.afterMs > 0) {
        try {
          await delay(step.afterMs, undefined, {
            signal: this.abortController.signal
          });
        } catch {
          return;
        }
      }
      if (this.abortController.signal.aborted) {
        return;
      }
      this.emitEvent(step.event);
      if (isBrowserTerminalEvent(step.event.kind)) {
        this.recordTerminalFromEvent(step.event);
        this.reachedTerminalNaturally = true;
        this.notifyTerminated();
        return;
      }
    }
    // Script exhausted without a terminal event — the session is considered
    // hung. The runner detects this via its own timeout.
  }

  private emitEvent(event: BrowserEvent): void {
    for (const listener of this.eventListeners) {
      listener(event);
    }
  }

  private notifyTerminated(): void {
    if (this.terminated) {
      return;
    }
    this.terminated = true;
    for (const listener of this.terminatedListeners) {
      listener();
    }
  }

  private recordTerminalFromEvent(event: BrowserEvent): void {
    if (event.kind === "pass" || event.kind === "done") {
      try {
        this.recorder.transition("completed");
      } catch {}
      return;
    }
    if (event.kind === "fail" || event.kind === "error") {
      try {
        this.recorder.transition("failed");
      } catch {}
    }
  }

  async abort(reason: BrowserSessionAbortReason): Promise<void> {
    if (this.abortController.signal.aborted) {
      return;
    }
    this.abortController.abort();
    if (this.reachedTerminalNaturally) {
      return;
    }
    const target: BrowserLauncherLifecycleState =
      reason === "timeout" ? "timed-out" : "failed";
    if (
      this.recorder.state === "launching" ||
      this.recorder.state === "running"
    ) {
      try {
        this.recorder.transition(target);
      } catch {}
    }
    this.notifyTerminated();
  }

  async cleanup(): Promise<void> {
    if (this.recorder.state === "cleaned-up") {
      return;
    }
    if (this.recorder.state === "created") {
      try {
        this.recorder.transition("failed");
      } catch {}
    }
    if (
      this.recorder.state === "launching" ||
      this.recorder.state === "running"
    ) {
      try {
        this.recorder.transition("failed");
      } catch {}
    }
    try {
      this.recorder.transition("cleaned-up");
    } catch {}
  }
}
