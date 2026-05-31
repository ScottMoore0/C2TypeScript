/* FFFFFFFF >> 14. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0xFFFFFFFFu;
  printf("%X\n", v >> 14);
  return 0;
}
