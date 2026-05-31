/* GCC __attribute__((aligned(N))) — alignment hint.
 * Functional behaviour: program runs identically; alignment is a layout
 * concern that doesn't change observable output. */
#include <stdio.h>
struct __attribute__((aligned(8))) S { int x; };
int main(void) {
  struct S s;
  s.x = 42;
  printf("%d\n", s.x);
  return 0;
}
