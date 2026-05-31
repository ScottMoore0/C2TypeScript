/* 80000000 >> 0. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0x80000000u;
  printf("%X\n", v >> 0);
  return 0;
}
