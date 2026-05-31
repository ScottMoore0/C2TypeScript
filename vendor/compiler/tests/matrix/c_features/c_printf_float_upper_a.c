/* printf float format: upper_a = `%A` on 1.5. */
#include <stdio.h>
int main(void) {
  double v = 1.5;
  printf("%A\n", v);
  return 0;
}
