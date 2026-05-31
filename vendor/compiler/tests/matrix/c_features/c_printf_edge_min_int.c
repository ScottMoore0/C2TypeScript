/* printf edge case: min_int = -2147483648 via %d. */
#include <stdio.h>
int main(void) {
  printf("%d\n", -2147483648);
  return 0;
}
