/* 80000000 >> 15. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0x80000000u;
  printf("%X\n", v >> 15);
  return 0;
}
