/* 80000000 >> 2. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0x80000000u;
  printf("%X\n", v >> 2);
  return 0;
}
