/* Cast long → int. */
#include <stdio.h>
#include <stddef.h>
int main(void) {
  long src = 1234567L;
  int dst = (int)src;
  printf("%d\n", dst);
  return 0;
}
