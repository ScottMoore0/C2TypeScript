/* FFFFFFFF >> 5. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0xFFFFFFFFu;
  printf("%X\n", v >> 5);
  return 0;
}
