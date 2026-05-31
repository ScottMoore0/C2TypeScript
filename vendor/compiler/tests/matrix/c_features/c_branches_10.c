/* If/elseif chain with 10 branches. */
#include <stdio.h>
int main(void) {
  int x = 5, y = 0;
  if (x == 0) y = 0;
  else if (x == 1) y = 10;
  else if (x == 2) y = 20;
  else if (x == 3) y = 30;
  else if (x == 4) y = 40;
  else if (x == 5) y = 50;
  else if (x == 6) y = 60;
  else if (x == 7) y = 70;
  else if (x == 8) y = 80;
  else if (x == 9) y = 90;
  else y = -1;
  printf("%d\n", y);
  return 0;
}
