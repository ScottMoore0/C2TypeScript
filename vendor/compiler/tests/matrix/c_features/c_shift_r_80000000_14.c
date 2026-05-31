/* 80000000 >> 14. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0x80000000u;
  printf("%X\n", v >> 14);
  return 0;
}
