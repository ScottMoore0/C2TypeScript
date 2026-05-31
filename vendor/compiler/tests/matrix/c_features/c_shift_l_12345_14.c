/* 12345 << 14. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0x12345u;
  printf("%X\n", v << 14);
  return 0;
}
