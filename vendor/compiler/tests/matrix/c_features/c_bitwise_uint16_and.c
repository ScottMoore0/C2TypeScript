/* Bitwise AND on uint16_t. */
#include <stdio.h>
#include <stdint.h>
int main(void) {
  uint16_t a = (uint16_t)0xFFFFu;
  uint16_t b = a >> 2;
  unsigned long long r = (unsigned long long)(a & b);
  printf("%llu\n", r);
  return 0;
}
