/* 80000000 >> 11. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0x80000000u;
  printf("%X\n", v >> 11);
  return 0;
}
