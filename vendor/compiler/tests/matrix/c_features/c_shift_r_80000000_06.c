/* 80000000 >> 6. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0x80000000u;
  printf("%X\n", v >> 6);
  return 0;
}
