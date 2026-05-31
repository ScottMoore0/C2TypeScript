/* Safe division with check for zero. */
#include <stdio.h>
int safe_div(int a, int b, int default_val) { return b == 0 ? default_val : a / b; }
int main(void) {
  printf("%d %d %d\n", safe_div(10, 2, 0), safe_div(10, 0, -1), safe_div(7, 3, 0));
  return 0;
}
