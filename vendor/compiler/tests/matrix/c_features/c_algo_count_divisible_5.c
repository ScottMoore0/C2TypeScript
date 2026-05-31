/* Algorithm: count_divisible_5. */
#include <stdio.h>
int main(void) {
  int c = 0; for (int i = 1; i <= 100; i++) if (i % 5 == 0) c++;
  printf("%d\n", c);
  return 0;
}
