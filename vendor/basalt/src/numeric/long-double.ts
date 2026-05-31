// BC-3c: long double — documented graceful degradation.
// C17 §6.2.5 ¶10: long double >= double precision.
// C17 §5.2.4.2.2: floating characteristics (LDBL_*).
// C++20 [basic.fundamental] ¶12: same.
//
// x86/x87 long double is 80-bit extended precision stored in 10 bytes
// (16 with padding in x86-64 ABI). JavaScript has only IEEE-754 double
// (64-bit). We therefore implement long double as double + explicit
// "degraded precision" diagnostics so translated code still runs
// deterministically but users are warned about values whose behaviour
// would differ from a native C build.

import type { CPtr } from "../memory/cptr.js";

// NOTE: reduced precision — JavaScript has no 80-bit extended type,
// so long double is represented by double. These constants are the
// IEEE-754 double equivalents of LDBL_EPSILON / LDBL_MAX / LDBL_MIN.
// Translated code relying on sub-double epsilons will degrade gracefully
// and surface a diagnostic through long_double_diagnose.

/** Smallest x such that 1.0 + x != 1.0 (double-precision fallback). */
export const LONG_DOUBLE_EPSILON: number = Number.EPSILON;
/** Largest finite positive value (double-precision fallback). */
export const LONG_DOUBLE_MAX: number = Number.MAX_VALUE;
/** Smallest positive normalised value (double-precision fallback). */
export const LONG_DOUBLE_MIN: number = Number.MIN_VALUE;

// --- Precision diagnostics ---

/** True if x has fewer than ~16 significant decimal digits — i.e. safely
 *  representable in double without needing extended precision.
 *  C17 §5.2.4.2.2 ¶10 defines DBL_DIG >= 10; mainstream doubles give 15–17. */
export function long_double_precision_ok(x: number): boolean {
  if (!Number.isFinite(x)) return true; // inf/NaN behave identically
  if (x === 0) return true;
  // A number whose shortest decimal rendering has <= 15 significant digits
  // is safely representable in double.
  const s = Math.abs(x).toExponential();
  const mantissa = s.split("e")[0]!.replace(".", "").replace(/0+$/, "");
  return mantissa.length <= 15;
}

/** Collected warnings about long double precision loss.
 *  Translated code can drain this via long_double_drain_warnings(). */
const _longDoubleWarnings: string[] = [];

/** Drain and return all pending precision-loss warnings. */
export function long_double_drain_warnings(): string[] {
  const out = _longDoubleWarnings.slice();
  _longDoubleWarnings.length = 0;
  return out;
}

/** Emit a warning into the collector (used by cptr_*_long_double). */
function _longDoubleWarn(msg: string): void {
  _longDoubleWarnings.push(msg);
}

/** Return a diagnostic string if x appears to need >double precision
 *  in the given context (e.g. "near 1.0 with ULP-scale differences"),
 *  or null if double precision suffices. */
export function long_double_diagnose(x: number, context: string): string | null {
  if (!Number.isFinite(x)) return null;
  // Heuristic 1: values extremely close to 1.0 where differences approach ULP.
  if (x !== 0 && Math.abs(x - 1.0) > 0 && Math.abs(x - 1.0) < LONG_DOUBLE_EPSILON * 4) {
    return `long double precision loss near 1.0 in ${context}: value ${x} differs from 1.0 by only ~${Math.abs(x - 1.0)}`;
  }
  // Heuristic 2: magnitudes beyond double's exponent range would flush.
  if (Math.abs(x) > 0 && Math.abs(x) < LONG_DOUBLE_MIN * 2) {
    return `long double subnormal/underflow in ${context}: |value| ${Math.abs(x)} below double MIN`;
  }
  // Heuristic 3: rendering needs more than 15 digits.
  if (!long_double_precision_ok(x)) {
    return `long double precision loss in ${context}: value ${x} requires >15 significant digits`;
  }
  return null;
}

// --- CPtr 16-byte reads/writes ---
// x86-64 SysV ABI: long double occupies 16 bytes (10 bytes of x87 data +
// 6 bytes of padding). We store only the 8-byte double portion at the
// base offset and leave the remaining 8 bytes zeroed. On read, we load
// the double and flag that precision beyond double is unavailable.

/** Size of long double in the target ABI (x86-64). */
export const LONG_DOUBLE_SIZE: number = 16;

function _view(ptr: CPtr): DataView {
  return new DataView(ptr.buf.buffer, ptr.buf.byteOffset);
}

/** Read a long double as a double; record a precision-loss warning. */
export function cptr_read_long_double(ptr: CPtr, offset: number = 0): number {
  const v = _view(ptr).getFloat64(ptr.off + offset, true);
  _longDoubleWarn(`cptr_read_long_double at offset ${ptr.off + offset}: read as double (extended precision unavailable)`);
  return v;
}

/** Write a double into the long double slot; pad remaining 8 bytes with zero. */
export function cptr_write_long_double(ptr: CPtr, offset: number, value: number): void {
  const dv = _view(ptr);
  const base = ptr.off + offset;
  dv.setFloat64(base, value, true);
  // Zero the 8-byte tail so reads of the full 16-byte slot are deterministic.
  for (let i = 8; i < LONG_DOUBLE_SIZE; i++) {
    ptr.buf[base + i] = 0;
  }
  _longDoubleWarn(`cptr_write_long_double at offset ${base}: stored as double (extended precision truncated)`);
}
