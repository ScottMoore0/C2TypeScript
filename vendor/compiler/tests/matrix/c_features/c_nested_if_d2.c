/* Nested if depth 2. */
#include <stdio.h>
int main(void) {
  int x = 0;
  int v = 5;
  if (v >= 0) {
    x = 1;
    if (v >= 1) {
      x = 2;
    }
  }

  printf("%d\n", x);
  return 0;
}
