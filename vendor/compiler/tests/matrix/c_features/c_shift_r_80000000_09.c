/* 80000000 >> 9. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0x80000000u;
  printf("%X\n", v >> 9);
  return 0;
}
