/* 80000000 >> 12. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0x80000000u;
  printf("%X\n", v >> 12);
  return 0;
}
