/* if-statement pattern: nested_if. */
#include <stdio.h>
int main(void) {
  int x = 7, y = 0;
  if (x > 0) { if (x > 10) y = 100; else y = 50; } else y = -1;
  printf("%d\n", y);
  return 0;
}
