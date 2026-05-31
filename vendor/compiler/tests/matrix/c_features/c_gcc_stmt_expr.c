/* GCC statement-expressions: ({ stmt; stmt; expr }) — pervasive in
 * Linux kernel, glibc, libuv, Redis. The result of the expression
 * is the last expression in the block.
 */
#include <stdio.h>

#define MAX(a, b) ({ typeof(a) _a = (a); typeof(b) _b = (b); _a > _b ? _a : _b; })

int main(void) {
  int x = ({ int t = 5; t * 2; });
  printf("x=%d\n", x);

  int m = MAX(3, 7);
  printf("m=%d\n", m);

  /* Side-effect-safe MAX (the typical motivation) */
  int counter = 0;
  int safe = MAX(++counter, 0);
  printf("safe=%d counter=%d\n", safe, counter);
  return 0;
}
