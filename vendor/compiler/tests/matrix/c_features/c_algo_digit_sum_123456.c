/* Algorithm: digit_sum_123456. */
#include <stdio.h>
int main(void) {
  int n = 123456, s = 0;
  while (n > 0) { s += n % 10; n /= 10; }
  printf("%d\n", s);
  return 0;
}
