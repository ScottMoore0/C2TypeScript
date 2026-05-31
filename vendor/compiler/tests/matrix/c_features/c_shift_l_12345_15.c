/* 12345 << 15. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0x12345u;
  printf("%X\n", v << 15);
  return 0;
}
