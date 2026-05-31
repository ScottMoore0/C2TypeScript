/* GCC __attribute__((constructor)) / ((destructor)) — functions that
 * run before main / after main returns. Used by libraries to register
 * themselves, set up global state, run shutdown hooks. Pervasive in
 * pthreads, malloc replacements (jemalloc), profiling hooks.
 */
#include <stdio.h>

static int counter = 0;

/* Use explicit priorities — without them, ctor order is implementation-
 * defined (MinGW runs reverse-source, glibc runs source-order). Lower
 * priority runs first per GCC docs. */
__attribute__((constructor(101)))
static void ctor_a(void) { counter += 1; printf("ctor-a\n"); }

__attribute__((constructor(102)))
static void ctor_b(void) { counter += 10; printf("ctor-b\n"); }

__attribute__((destructor(101)))
static void dtor(void) { printf("dtor counter=%d\n", counter); }

int main(void) {
  printf("main counter=%d\n", counter);
  return 0;
}
