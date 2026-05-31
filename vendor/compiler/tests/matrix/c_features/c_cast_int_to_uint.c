/* Cast int → unsigned int. */
#include <stdio.h>
#include <stddef.h>
int main(void) {
  int src = -1;
  unsigned int dst = (unsigned int)src;
  printf("%u\n", dst);
  return 0;
}
