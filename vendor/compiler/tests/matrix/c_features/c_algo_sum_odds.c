/* Algorithm: sum_odds. */
#include <stdio.h>
int main(void) {
  int s = 0; for (int i = 1; i <= 20; i++) if (i % 2 != 0) s += i;
  printf("%d\n", s);
  return 0;
}
