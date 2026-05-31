/* printf float format: e_neg = `%e` on 1.5e-10. */
#include <stdio.h>
int main(void) {
  double v = 1.5e-10;
  printf("%e\n", v);
  return 0;
}
