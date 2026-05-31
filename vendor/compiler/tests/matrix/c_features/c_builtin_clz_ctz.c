/* GCC __builtin_clz / __builtin_ctz — count leading/trailing zeros.
 * Note: clz(0) and ctz(0) are undefined; we test only nonzero. */
#include <stdio.h>
int main(void) {
  printf("%d %d\n", __builtin_clz(1u), __builtin_ctz(1u));
  printf("%d %d\n", __builtin_clz(0x80u), __builtin_ctz(0x80u));
  printf("%d %d\n", __builtin_clz(0x80000000u), __builtin_ctz(0x80000000u));
  return 0;
}
