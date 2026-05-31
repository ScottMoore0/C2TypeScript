/* C17 §6.7.1 p2 — `_Thread_local` storage-class-specifier.
 *
 * Declares an int with thread-local storage duration. Under the
 * single-threaded JS inproc model, per-thread is observationally equivalent
 * to per-process: the variable behaves as a module-level binding.
 *
 * Test exercises declaration, write, and read of a `_Thread_local int`.
 * Used by glibc internals, Boehm GC, jemalloc, TCMalloc — anything with
 * thread-local arena pools or per-thread caches.
 */
#include <stdio.h>

_Thread_local int counter;

int main(void) {
  counter = 42;
  printf("%d\n", counter);
  counter += 8;
  printf("%d\n", counter);
  return 0;
}
