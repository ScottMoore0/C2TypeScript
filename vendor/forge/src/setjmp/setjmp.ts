// FC-12: C setjmp/longjmp.
// C17 §7.13: Nonlocal jumps.
//
// setjmp/longjmp is implemented via exceptions.
// setjmp() returns 0 on first call, and the longjmp value on subsequent returns.
// This is emulated using try/catch with a custom signal class.

/** The jmp_buf type — stores the exception handler context. */
export interface JmpBuf {
  _set: boolean;
}

/** Signal thrown by longjmp to unwind the stack. */
export class LongjmpSignal extends Error {
  readonly value: number;
  readonly buf: JmpBuf;
  constructor(buf: JmpBuf, value: number) {
    super(`longjmp(${value})`);
    this.name = "LongjmpSignal";
    this.buf = buf;
    this.value = value === 0 ? 1 : value;
  }
}

/** C17 §7.13.2.1: longjmp — jump to saved context. */
export function c_longjmp(buf: JmpBuf, value: number): never {
  throw new LongjmpSignal(buf, value);
}

/**
 * C17 §7.13.1.1: setjmp — save execution context.
 *
 * Usage pattern (emitter generates this):
 * ```
 * const jmpBuf: JmpBuf = { _set: false };
 * let setjmpResult = 0;
 * try {
 *   // ... code that may call longjmp(jmpBuf, val) ...
 * } catch (e) {
 *   if (e instanceof LongjmpSignal && e.buf === jmpBuf) {
 *     setjmpResult = e.value;
 *     // re-enter from setjmp point with setjmpResult
 *   } else throw e;
 * }
 * ```
 *
 * setjmp itself just creates the buffer — the emitter must wrap
 * the containing scope in try/catch.
 */
export function c_setjmp(buf: JmpBuf): number {
  buf._set = true;
  return 0;
}

// ---------------------------------------------------------------------------
// POSIX.1-2017 sigsetjmp / siglongjmp
// ---------------------------------------------------------------------------
//
// POSIX sigsetjmp/siglongjmp extend setjmp/longjmp with an explicit signal-mask
// save flag. Under this runtime there are no UNIX signal masks to restore, so
// sigsetjmp/siglongjmp degenerate to setjmp/longjmp with the savesigs argument
// carried (and ignored) for API compatibility.

/** POSIX.1-2017: sigjmp_buf — signal-aware jmp_buf. Extends JmpBuf with a
 *  stashed savesigs flag. */
export interface SigJmpBuf extends JmpBuf {
  /** Nonzero if the save-signal-mask behaviour was requested by sigsetjmp. */
  _savesigs: number;
}

/** POSIX.1-2017: sigsetjmp — save execution context plus (optionally) the
 *  current signal mask. `savesigs` is nonzero to request mask save/restore.
 *  Emitter wraps the containing scope in try/catch mirroring the setjmp
 *  contract; the only visible difference is that `e.buf._savesigs` is preserved
 *  for any diagnostic caller that inspects it. */
export function c_sigsetjmp(buf: SigJmpBuf, savesigs: number): number {
  buf._set = true;
  buf._savesigs = savesigs | 0;
  return 0;
}

/** POSIX.1-2017: siglongjmp — jump to a sigsetjmp context. Semantically
 *  identical to longjmp under this runtime because signal masks are not
 *  modelled. */
export function c_siglongjmp(buf: SigJmpBuf, value: number): never {
  throw new LongjmpSignal(buf, value);
}
