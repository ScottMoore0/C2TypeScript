/* printf format: hd_neg. */
#include <stdio.h>
#include <stddef.h>
int main(void) {
  short v = -100;
  printf("%hd" "\n", v);
  return 0;
}
