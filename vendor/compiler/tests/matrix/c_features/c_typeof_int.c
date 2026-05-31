/* GCC __typeof__ — extract type from expression. */
#include <stdio.h>
int main(void) {
  int a = 7;
  __typeof__(a) b = a + 1;
  __typeof__(a + 0.5) c = a + 0.5;     /* double */
  printf("%d %.1f\n", b, c);
  return 0;
}
