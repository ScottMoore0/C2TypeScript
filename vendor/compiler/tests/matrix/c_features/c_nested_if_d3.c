/* Nested if depth 3. */
#include <stdio.h>
int main(void) {
  int x = 0;
  int v = 5;
  if (v >= 0) {
    x = 1;
    if (v >= 1) {
      x = 2;
      if (v >= 2) {
        x = 3;
      }
    }
  }

  printf("%d\n", x);
  return 0;
}
