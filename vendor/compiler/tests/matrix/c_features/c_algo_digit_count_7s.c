/* Algorithm: digit_count_7s. */
#include <stdio.h>
int main(void) {
  int n = 7177, c = 0;
  while (n > 0) { if (n % 10 == 7) c++; n /= 10; }
  printf("%d\n", c);
  return 0;
}
