/* GCC __builtin_bswap16/32/64 — byte-swap. */
#include <stdio.h>
int main(void) {
  printf("%X %X %llX\n",
    __builtin_bswap16(0xAABB),
    __builtin_bswap32(0xAABBCCDDu),
    (unsigned long long)__builtin_bswap64(0x0123456789ABCDEFull));
  return 0;
}
