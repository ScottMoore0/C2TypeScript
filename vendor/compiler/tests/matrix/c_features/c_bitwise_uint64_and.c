/* Bitwise AND on uint64_t. */
#include <stdio.h>
#include <stdint.h>
int main(void) {
  uint64_t a = (uint64_t)0xFFFFFFFFFFFFFFFFull;
  uint64_t b = a >> 2;
  unsigned long long r = (unsigned long long)(a & b);
  printf("%llu\n", r);
  return 0;
}
