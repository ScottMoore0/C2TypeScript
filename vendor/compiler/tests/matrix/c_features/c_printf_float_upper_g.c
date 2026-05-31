/* printf float format: upper_g = `%G` on 12.34. */
#include <stdio.h>
int main(void) {
  double v = 12.34;
  printf("%G\n", v);
  return 0;
}
