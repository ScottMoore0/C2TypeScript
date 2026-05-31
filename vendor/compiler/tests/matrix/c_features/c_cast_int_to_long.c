/* Cast int → long. */
#include <stdio.h>
#include <stddef.h>
int main(void) {
  int src = -1;
  long dst = (long)src;
  printf("%ld\n", dst);
  return 0;
}
