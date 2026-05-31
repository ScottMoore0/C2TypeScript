/* Bit op: popcount on 0x1. */
#include <stdio.h>
int op_fn(unsigned x) {
  int c = 0; while (x) { c += x & 1; x >>= 1; } 
  return c;
}
int main(void) {
  printf("%d\n", op_fn(1u));
  return 0;
}
