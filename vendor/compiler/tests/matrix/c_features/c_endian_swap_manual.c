/* Byte-swap a 32-bit int manually. */
#include <stdio.h>
#include <stdint.h>
uint32_t bswap32(uint32_t x) {
  return ((x & 0xFF) << 24) | ((x & 0xFF00) << 8)
       | ((x & 0xFF0000) >> 8) | ((x & 0xFF000000u) >> 24);
}
int main(void) {
  printf("%08X %08X\n", bswap32(0xAABBCCDDu), bswap32(0x12345678u));
  return 0;
}
