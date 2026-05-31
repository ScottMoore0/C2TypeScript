/* Nested if at depth 1. */
#include <stdio.h>
int main(void) {
  int x = 100;
  if (x > 10) {
    printf("deep_%d\n", x);
  }
  return 0;
}
