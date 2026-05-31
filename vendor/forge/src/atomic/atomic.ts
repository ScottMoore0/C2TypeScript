// stdatomic.h — C11 §7.17 atomic operations.
// JavaScript is single-threaded within an execution context, so all atomics
// trivially degenerate to plain reads/writes per C11 §5.1.2.4 (memory orders
// are no-ops in a strictly sequential execution). Shared memory across Web
// Workers would require SharedArrayBuffer + Atomics, which is out of scope here.

/** C11 §7.17.3 memory_order enumeration (values are illustrative; semantics are
 *  irrelevant under single-thread execution). */
export const memory_order_relaxed = 0;
export const memory_order_consume = 1;
export const memory_order_acquire = 2;
export const memory_order_release = 3;
export const memory_order_acq_rel = 4;
export const memory_order_seq_cst = 5;
export type memory_order = number;

/** C11 §7.17.8.10 atomic_flag — test-and-set flag. */
export interface AtomicFlag { _v: boolean; }
export const ATOMIC_FLAG_INIT: AtomicFlag = { _v: false };

/** C11 §7.17.2.5 ATOMIC_VAR_INIT — initializer. Returns the value unchanged. */
export function ATOMIC_VAR_INIT<T>(v: T): T { return v; }

/** C11 §7.17.2.4 atomic_init — initialize an atomic object (must be last operation before concurrent access). */
export function atomic_init<T>(obj: { value: T }, desired: T): void { obj.value = desired; }

/** C11 §7.17.3.1 atomic_thread_fence — fence; no-op in single-thread. */
export function atomic_thread_fence(_order: memory_order): void { /* no-op */ }
/** C11 §7.17.3.2 atomic_signal_fence. */
export function atomic_signal_fence(_order: memory_order): void { /* no-op */ }

/** C11 §7.17.4.1 atomic_is_lock_free — all our atomics are trivially lock-free. */
export function atomic_is_lock_free(_obj: unknown): number { return 1; }

/** C11 §7.17.7.1 atomic_store / §7.17.7.1 atomic_store_explicit. */
export function atomic_store<T>(obj: { value: T }, desired: T): void { obj.value = desired; }
export function atomic_store_explicit<T>(obj: { value: T }, desired: T, _o: memory_order): void { obj.value = desired; }

/** C11 §7.17.7.2 atomic_load / atomic_load_explicit. */
export function atomic_load<T>(obj: { value: T }): T { return obj.value; }
export function atomic_load_explicit<T>(obj: { value: T }, _o: memory_order): T { return obj.value; }

/** C11 §7.17.7.3 atomic_exchange / atomic_exchange_explicit. */
export function atomic_exchange<T>(obj: { value: T }, desired: T): T {
  const prev = obj.value; obj.value = desired; return prev;
}
export function atomic_exchange_explicit<T>(obj: { value: T }, desired: T, _o: memory_order): T {
  return atomic_exchange(obj, desired);
}

/** C11 §7.17.7.4 atomic_compare_exchange_strong — compare *expected with obj; if equal
 *  set obj to desired and return 1, else store obj.value into *expected and return 0. */
export function atomic_compare_exchange_strong<T>(
  obj: { value: T }, expected: { value: T }, desired: T
): number {
  if (Object.is(obj.value, expected.value)) { obj.value = desired; return 1; }
  expected.value = obj.value; return 0;
}
export function atomic_compare_exchange_weak<T>(
  obj: { value: T }, expected: { value: T }, desired: T
): number {
  // In single-thread execution, weak == strong; spurious failures are not required (§7.17.7.4 p4).
  return atomic_compare_exchange_strong(obj, expected, desired);
}
export function atomic_compare_exchange_strong_explicit<T>(
  obj: { value: T }, expected: { value: T }, desired: T, _s: memory_order, _f: memory_order
): number { return atomic_compare_exchange_strong(obj, expected, desired); }
export function atomic_compare_exchange_weak_explicit<T>(
  obj: { value: T }, expected: { value: T }, desired: T, _s: memory_order, _f: memory_order
): number { return atomic_compare_exchange_strong(obj, expected, desired); }

/** C11 §7.17.7.5 atomic_fetch_add / sub / or / xor / and. Returns previous value. */
export function atomic_fetch_add(obj: { value: number }, op: number): number {
  const prev = obj.value; obj.value = prev + op; return prev;
}
export function atomic_fetch_sub(obj: { value: number }, op: number): number {
  const prev = obj.value; obj.value = prev - op; return prev;
}
export function atomic_fetch_or(obj: { value: number }, op: number): number {
  const prev = obj.value; obj.value = prev | op; return prev;
}
export function atomic_fetch_xor(obj: { value: number }, op: number): number {
  const prev = obj.value; obj.value = prev ^ op; return prev;
}
export function atomic_fetch_and(obj: { value: number }, op: number): number {
  const prev = obj.value; obj.value = prev & op; return prev;
}

/** C11 §7.17.8.1 atomic_flag_test_and_set — set to true, return previous. */
export function atomic_flag_test_and_set(f: AtomicFlag): number {
  const prev = f._v ? 1 : 0; f._v = true; return prev;
}
export function atomic_flag_test_and_set_explicit(f: AtomicFlag, _o: memory_order): number {
  return atomic_flag_test_and_set(f);
}

/** C11 §7.17.8.2 atomic_flag_clear. */
export function atomic_flag_clear(f: AtomicFlag): void { f._v = false; }
export function atomic_flag_clear_explicit(f: AtomicFlag, _o: memory_order): void { f._v = false; }

/** C11 §7.17.6.1 kill_dependency — identity function for release_consume ordering. */
export function kill_dependency<T>(v: T): T { return v; }
