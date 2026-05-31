/* if-statement pattern: if_elseif_else. */
#include <stdio.h>
int main(void) {
  int x = 7, y = 0;
  if (x > 10) y = 100; else if (x > 5) y = 50; else y = 0;
  printf("%d\n", y);
  return 0;
}
