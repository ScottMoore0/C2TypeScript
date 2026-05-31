/* Cast unsigned int → int. */
#include <stdio.h>
#include <stddef.h>
int main(void) {
  unsigned int src = 0xFFFFFFFFu;
  int dst = (int)src;
  printf("%d\n", dst);
  return 0;
}
