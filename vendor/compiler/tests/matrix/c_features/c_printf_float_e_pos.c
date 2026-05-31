/* printf float format: e_pos = `%e` on 1.5e10. */
#include <stdio.h>
int main(void) {
  double v = 1.5e10;
  printf("%e\n", v);
  return 0;
}
