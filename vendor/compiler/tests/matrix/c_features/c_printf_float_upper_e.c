/* printf float format: upper_e = `%E` on 12.34. */
#include <stdio.h>
int main(void) {
  double v = 12.34;
  printf("%E\n", v);
  return 0;
}
