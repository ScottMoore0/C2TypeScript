/* Hash xor_rot of "test". */
#include <stdio.h>
unsigned long hash(const char *s) {
  unsigned long h = 0;
  for (const char *p = s; *p; p++) { h ^= (unsigned char)*p; h = (h << 1) | (h >> 31); }
  return h;
}
int main(void) {
  printf("%lu\n", hash("test"));
  return 0;
}
