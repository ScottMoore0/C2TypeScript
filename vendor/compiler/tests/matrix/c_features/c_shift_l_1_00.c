/* 1 << 0. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0x1u;
  printf("%X\n", v << 0);
  return 0;
}
