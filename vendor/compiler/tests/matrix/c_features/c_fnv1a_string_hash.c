/* FNV-1a string hash. */
#include <stdio.h>
#include <stdint.h>
uint32_t fnv1a(const char *s) {
  uint32_t h = 0x811C9DC5u;
  while (*s) { h ^= (unsigned char)*s++; h *= 0x01000193u; }
  return h;
}
int main(void) {
  printf("%08X %08X %08X\n", fnv1a("foo"), fnv1a("bar"), fnv1a(""));
  return 0;
}
