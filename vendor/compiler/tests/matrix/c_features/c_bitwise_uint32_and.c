/* Bitwise AND on uint32_t. */
#include <stdio.h>
#include <stdint.h>
int main(void) {
  uint32_t a = (uint32_t)0xFFFFFFFFu;
  uint32_t b = a >> 2;
  unsigned long long r = (unsigned long long)(a & b);
  printf("%llu\n", r);
  return 0;
}
