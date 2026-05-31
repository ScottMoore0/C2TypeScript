/* 80000000 >> 7. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0x80000000u;
  printf("%X\n", v >> 7);
  return 0;
}
