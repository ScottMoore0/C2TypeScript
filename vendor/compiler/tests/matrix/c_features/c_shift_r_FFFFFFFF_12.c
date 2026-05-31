/* FFFFFFFF >> 12. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0xFFFFFFFFu;
  printf("%X\n", v >> 12);
  return 0;
}
