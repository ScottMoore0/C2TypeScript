/* FFFFFFFF >> 13. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0xFFFFFFFFu;
  printf("%X\n", v >> 13);
  return 0;
}
