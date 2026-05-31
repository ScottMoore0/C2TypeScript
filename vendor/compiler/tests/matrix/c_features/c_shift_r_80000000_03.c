/* 80000000 >> 3. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0x80000000u;
  printf("%X\n", v >> 3);
  return 0;
}
