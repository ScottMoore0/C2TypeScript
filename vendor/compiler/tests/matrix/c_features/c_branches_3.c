/* If/elseif chain with 3 branches. */
#include <stdio.h>
int main(void) {
  int x = 1, y = 0;
  if (x == 0) y = 0;
  else if (x == 1) y = 10;
  else if (x == 2) y = 20;
  else y = -1;
  printf("%d\n", y);
  return 0;
}
