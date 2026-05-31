/* 12345 << 11. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0x12345u;
  printf("%X\n", v << 11);
  return 0;
}
