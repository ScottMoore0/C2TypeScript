/* printf edge case: zero_int = 0 via %d. */
#include <stdio.h>
int main(void) {
  printf("%d\n", 0);
  return 0;
}
