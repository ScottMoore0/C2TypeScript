/* Algorithm: alternating_sum. */
#include <stdio.h>
int main(void) {
  int s = 0; for (int i = 1; i <= 20; i++) s += (i % 2 == 0) ? -i : i;
  printf("%d\n", s);
  return 0;
}
