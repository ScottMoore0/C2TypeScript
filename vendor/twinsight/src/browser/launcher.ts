import {
  isValidBrowserLauncherTransition,
  type BrowserEvent,
  type BrowserLaunchRequest,
  type BrowserLauncherLifecycleState,
  type BrowserLifecycleTraceEntry
} from "./types.js";

export type BrowserSessionAbortReason = "timeout" | "caller";

export interface BrowserLauncher {
  launch(request: BrowserLaunchRequest): Promise<BrowserLaunchSession>;
}

export interface BrowserLaunchSession {
  readonly state: BrowserLauncherLifecycleState;
  readonly lifecycleTrace: readonly BrowserLifecycleTraceEntry[];
  onEvent(listener: (event: BrowserEvent) => void): () => void;
  onTerminated(listener: () => void): () => void;
  start(): void;
  abort(reason: BrowserSessionAbortReason): Promise<void>;
  cleanup(): Promise<void>;
}

export class BrowserLifecycleRecorder {
  private currentState: BrowserLauncherLifecycleState = "created";
  private readonly entries: BrowserLifecycleTraceEntry[] = [];

  constructor(private readonly clock: () => number) {
    this.entries.push({ state: "created", atMs: this.clock() });
  }

  get state(): BrowserLauncherLifecycleState {
    return this.currentState;
  }

  get trace(): readonly BrowserLifecycleTraceEntry[] {
    return this.entries;
  }

  transition(to: BrowserLauncherLifecycleState): void {
    if (!isValidBrowserLauncherTransition(this.currentState, to)) {
      throw new Error(
        `invalid browser launcher transition: ${this.currentState} -> ${to}`
      );
    }
    this.currentState = to;
    this.entries.push({ state: to, atMs: this.clock() });
  }
}
