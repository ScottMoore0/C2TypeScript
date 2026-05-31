// FC-8: Threading stubs — pthread API mapped to no-ops or single-threaded equivalents.
// Real threading would require Web Workers; this provides API compatibility.

export type PthreadT = number;
export type PthreadMutexT = { locked: boolean };
export type PthreadCondT = { waiters: number };

let nextThreadId = 1;

/** pthread_create — stub: runs callback synchronously on current thread. */
export function pthread_create(
  _thread: { value: PthreadT },
  _attr: unknown,
  startRoutine: (arg: unknown) => unknown,
  arg: unknown
): number {
  _thread.value = nextThreadId++;
  // Run synchronously — no real threading.
  try { startRoutine(arg); } catch {}
  return 0;
}

/** pthread_join — stub: no-op (thread already ran synchronously). */
export function pthread_join(_thread: PthreadT, _retval: unknown): number { return 0; }

/** pthread_self — returns a thread ID. */
export function pthread_self(): PthreadT { return 1; }

/** pthread_mutex_init */
export function pthread_mutex_init(mutex: PthreadMutexT, _attr: unknown): number {
  mutex.locked = false; return 0;
}

/** pthread_mutex_lock */
export function pthread_mutex_lock(mutex: PthreadMutexT): number {
  mutex.locked = true; return 0;
}

/** pthread_mutex_unlock */
export function pthread_mutex_unlock(mutex: PthreadMutexT): number {
  mutex.locked = false; return 0;
}

/** pthread_mutex_destroy */
export function pthread_mutex_destroy(_mutex: PthreadMutexT): number { return 0; }

/** pthread_cond_init */
export function pthread_cond_init(cond: PthreadCondT, _attr: unknown): number {
  cond.waiters = 0; return 0;
}

/** pthread_cond_wait — no-op in single-threaded. */
export function pthread_cond_wait(_cond: PthreadCondT, _mutex: PthreadMutexT): number { return 0; }

/** pthread_cond_signal — no-op. */
export function pthread_cond_signal(_cond: PthreadCondT): number { return 0; }

/** pthread_cond_broadcast — no-op. */
export function pthread_cond_broadcast(_cond: PthreadCondT): number { return 0; }

/** pthread_cond_destroy */
export function pthread_cond_destroy(_cond: PthreadCondT): number { return 0; }
