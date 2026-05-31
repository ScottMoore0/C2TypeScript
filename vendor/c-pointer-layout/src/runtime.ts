// BC-5: Runtime state — the shared execution context for translated C programs.
// Owns the heap and provides the global state that translated functions operate on.

import { Heap } from "./memory/heap.js";
import { type CPtr } from "./memory/cptr.js";

export class Runtime {
  /** The heap allocator for this runtime instance. */
  readonly heap: Heap = new Heap();

  /** Global variables registry (name → CPtr or number). */
  private globals = new Map<string, CPtr | number>();

  /** Exit code set by translated exit() calls. */
  exitCode: number = 0;

  /** Whether the program has called exit(). */
  exited: boolean = false;

  // --- Global variables ---

  setGlobal(name: string, value: CPtr | number): void {
    this.globals.set(name, value);
  }

  getGlobal(name: string): CPtr | number | undefined {
    return this.globals.get(name);
  }

  // --- Lifecycle ---

  /** Signal program exit. C17 §7.22.4.4. */
  exit(code: number): never {
    this.exitCode = code;
    this.exited = true;
    throw new ExitSignal(code);
  }

  /** Reset the runtime to initial state. */
  reset(): void {
    this.heap.reset();
    this.globals.clear();
    this.exitCode = 0;
    this.exited = false;
  }

  // --- Diagnostics ---

  /** Check for memory leaks. */
  checkLeaks(): Array<{ size: number }> {
    return this.heap.leaks();
  }
}

/** Thrown by Runtime.exit() to unwind the call stack. */
export class ExitSignal extends Error {
  constructor(public readonly code: number) {
    super(`exit(${code})`);
    this.name = "ExitSignal";
  }
}
