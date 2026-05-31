/* Bitwise AND on uint8_t. */
#include <stdio.h>
#include <stdint.h>
int main(void) {
  uint8_t a = (uint8_t)0xFFu;
  uint8_t b = a >> 2;
  unsigned long long r = (unsigned long long)(a & b);
  printf("%llu\n", r);
  return 0;
}
