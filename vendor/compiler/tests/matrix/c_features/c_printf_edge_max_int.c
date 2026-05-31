/* printf edge case: max_int = 2147483647 via %d. */
#include <stdio.h>
int main(void) {
  printf("%d\n", 2147483647);
  return 0;
}
