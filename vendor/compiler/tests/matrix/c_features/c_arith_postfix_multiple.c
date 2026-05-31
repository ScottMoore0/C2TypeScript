/* Multiple postfix increments. */
#include <stdio.h>
int main(void) {
  int x = 0;
  int a = x++;
  int b = x++;
  int c = x++;
  printf("%d %d %d %d\n", a, b, c, x);
  return 0;
}
