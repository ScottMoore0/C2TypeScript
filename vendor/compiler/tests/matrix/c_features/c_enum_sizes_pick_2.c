/* Enum sizes pick LARGE. */
#include <stdio.h>
enum E_sizes { SMALL, MEDIUM, LARGE, XLARGE };
int main(void) {
  enum E_sizes x = LARGE;
  printf("%d\n", (int)x);
  return 0;
}
