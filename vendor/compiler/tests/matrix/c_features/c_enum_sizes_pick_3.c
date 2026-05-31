/* Enum sizes pick XLARGE. */
#include <stdio.h>
enum E_sizes { SMALL, MEDIUM, LARGE, XLARGE };
int main(void) {
  enum E_sizes x = XLARGE;
  printf("%d\n", (int)x);
  return 0;
}
