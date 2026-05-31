/* Count bits set across struct fields. */
#include <stdio.h>
struct Bits { unsigned int a, b, c, d; };
int popcount(unsigned int n) { int c = 0; while (n) { c += n & 1; n >>= 1; } return c; }
int main(void) {
  struct Bits b = { 0xF0F0, 0x00FF, 0xAAAA, 0x5555 };
  int total = popcount(b.a) + popcount(b.b) + popcount(b.c) + popcount(b.d);
  printf("%d\n", total);
  return 0;
}
