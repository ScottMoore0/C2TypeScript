/* FFFFFFFF >> 3. */
#include <stdio.h>
int main(void) {
  unsigned int v = 0xFFFFFFFFu;
  printf("%X\n", v >> 3);
  return 0;
}
