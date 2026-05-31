/* C17 §6.7.1 p2 — `_Thread_local` applied to an array type.
 *
 * Per C17 §6.2.4 p4, a thread-local object has thread storage duration; for
 * an array, all element accesses share that duration. Under the
 * single-threaded JS inproc model the array behaves as a module-level array.
 *
 * Test exercises element-wise write + sum readback of a `_Thread_local int[N]`.
 * Pattern matches per-thread cache lines used in jemalloc / TCMalloc tcache.
 */
#include <stdio.h>

_Thread_local int tcache[5];

int main(void) {
  int sum = 0;
  for (int i = 0; i < 5; i++) tcache[i] = (i + 1) * (i + 1);
  for (int i = 0; i < 5; i++) sum += tcache[i];
  printf("%d\n", sum);
  printf("%d %d %d %d %d\n", tcache[0], tcache[1], tcache[2], tcache[3], tcache[4]);
  return 0;
}
