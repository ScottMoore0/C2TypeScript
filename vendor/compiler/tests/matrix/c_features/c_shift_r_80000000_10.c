/* 80000000 >> 10. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0x80000000u;
  printf("%X\n", v >> 10);
  return 0;
}
