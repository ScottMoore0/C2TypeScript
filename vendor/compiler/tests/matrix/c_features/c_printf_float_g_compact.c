/* printf float format: g_compact = `%g` on 0.0001. */
#include <stdio.h>
int main(void) {
  double v = 0.0001;
  printf("%g\n", v);
  return 0;
}
