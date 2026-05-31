/* Nested if at depth 2. */
#include <stdio.h>
int main(void) {
  int x = 100;
  if (x > 10) {
    if (x > 20) {
      printf("deep_%d\n", x);
    }
  }
  return 0;
}
