/* Count 1-bits in unsigned int. */
#include <stdio.h>
int popcount(unsigned x) { int c = 0; while (x) { c += x & 1; x >>= 1; } return c; }
int main(void) {
  printf("%d %d %d %d\n", popcount(0u), popcount(0xFFu), popcount(0x80000000u), popcount(0xFFFFFFFFu));
  return 0;
}
