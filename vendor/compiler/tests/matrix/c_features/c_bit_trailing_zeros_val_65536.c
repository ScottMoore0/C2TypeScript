/* Bit op: trailing_zeros on 0x10000. */
#include <stdio.h>
int op_fn(unsigned x) {
  int c = 0; if (x == 0) c = 32; else while (!(x & 1)) { c++; x >>= 1; } 
  return c;
}
int main(void) {
  printf("%d\n", op_fn(65536u));
  return 0;
}
