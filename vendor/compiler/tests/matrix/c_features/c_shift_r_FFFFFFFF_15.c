/* FFFFFFFF >> 15. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0xFFFFFFFFu;
  printf("%X\n", v >> 15);
  return 0;
}
