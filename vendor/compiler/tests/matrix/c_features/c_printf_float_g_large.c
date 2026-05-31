/* printf float format: g_large = `%g` on 1e10. */
#include <stdio.h>
int main(void) {
  double v = 1e10;
  printf("%g\n", v);
  return 0;
}
