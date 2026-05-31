/* Bit op: leading_zeros on 0xFF. */
#include <stdio.h>
int op_fn(unsigned x) {
  int c = 0; if (x == 0) c = 32; else while (!(x & 0x80000000u)) { c++; x <<= 1; } 
  return c;
}
int main(void) {
  printf("%d\n", op_fn(255u));
  return 0;
}
