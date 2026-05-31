/* GCC __attribute__((weak)) — function definition can be overridden by
 * another translation unit's strong symbol. Within a single file, the
 * weak function behaves as a normal definition (the override only
 * matters at link time across TUs). For zero-fix translation of a
 * single TU, a weak function should call/return its body normally.
 */
#include <stdio.h>

__attribute__((weak))
int hook(void) { return 42; }

int main(void) {
  printf("hook=%d\n", hook());
  return 0;
}
