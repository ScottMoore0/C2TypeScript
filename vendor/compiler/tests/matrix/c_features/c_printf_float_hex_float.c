/* printf float format: hex_float = `%a` on 1.5. */
#include <stdio.h>
int main(void) {
  double v = 1.5;
  printf("%a\n", v);
  return 0;
}
