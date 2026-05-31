/* C17 §6.5.2.4 — postfix ++ and -- yield prior value. */
#include <stdio.h>
int main(void) {
  int x = 5;
  int a = x++;
  int b = x--;
  int c = x++;
  printf("%d %d %d %d\n", a, b, c, x);
  return 0;
}
