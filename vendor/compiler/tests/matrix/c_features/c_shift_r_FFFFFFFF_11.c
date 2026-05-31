/* FFFFFFFF >> 11. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0xFFFFFFFFu;
  printf("%X\n", v >> 11);
  return 0;
}
