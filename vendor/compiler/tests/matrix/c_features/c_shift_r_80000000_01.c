/* 80000000 >> 1. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0x80000000u;
  printf("%X\n", v >> 1);
  return 0;
}
