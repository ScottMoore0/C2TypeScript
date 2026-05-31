/* Cast double → int. */
#include <stdio.h>
#include <stddef.h>
int main(void) {
  double src = 3.7;
  int dst = (int)src;
  printf("%d\n", dst);
  return 0;
}
