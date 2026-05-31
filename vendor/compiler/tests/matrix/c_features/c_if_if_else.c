/* if-statement pattern: if_else. */
#include <stdio.h>
int main(void) {
  int x = 7, y = 0;
  if (x > 0) y = 1; else y = -1;
  printf("%d\n", y);
  return 0;
}
