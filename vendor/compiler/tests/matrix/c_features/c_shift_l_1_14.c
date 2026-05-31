/* 1 << 14. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0x1u;
  printf("%X\n", v << 14);
  return 0;
}
