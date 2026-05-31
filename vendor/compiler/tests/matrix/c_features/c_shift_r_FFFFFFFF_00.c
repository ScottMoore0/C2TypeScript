/* FFFFFFFF >> 0. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0xFFFFFFFFu;
  printf("%X\n", v >> 0);
  return 0;
}
