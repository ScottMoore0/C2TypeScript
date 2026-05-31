/* 80000000 >> 4. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0x80000000u;
  printf("%X\n", v >> 4);
  return 0;
}
