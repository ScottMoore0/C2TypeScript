/* FFFFFFFF >> 1. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0xFFFFFFFFu;
  printf("%X\n", v >> 1);
  return 0;
}
