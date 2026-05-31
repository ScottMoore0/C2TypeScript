/* If/elseif chain with 5 branches. */
#include <stdio.h>
int main(void) {
  int x = 2, y = 0;
  if (x == 0) y = 0;
  else if (x == 1) y = 10;
  else if (x == 2) y = 20;
  else if (x == 3) y = 30;
  else if (x == 4) y = 40;
  else y = -1;
  printf("%d\n", y);
  return 0;
}
