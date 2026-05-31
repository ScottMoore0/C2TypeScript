/* 80000000 >> 13. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0x80000000u;
  printf("%X\n", v >> 13);
  return 0;
}
