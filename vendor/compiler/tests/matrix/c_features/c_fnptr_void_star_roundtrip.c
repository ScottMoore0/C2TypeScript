/* C17 §6.3.2.3 — function pointer through void* round-trip.
 *
 * Plugin systems and dlsym-like APIs return `void *` and expect the
 * caller to cast it back to the right function-pointer type.
 * (Strictly UB in standard C between function and object pointers,
 * but POSIX and every real-world plugin system rely on it.)
 * The translator must preserve function identity through the cast.
 */
#include <stdio.h>

int hello(int x) { return x + 100; }

int main(void) {
  void *opaque = (void *)hello;
  int (*recovered)(int) = (int (*)(int))opaque;
  printf("v=%d\n", recovered(5));
  return 0;
}
