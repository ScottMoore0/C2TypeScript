/* Nested if at depth 3. */
#include <stdio.h>
int main(void) {
  int x = 100;
  if (x > 10) {
    if (x > 20) {
      if (x > 30) {
        printf("deep_%d\n", x);
      }
    }
  }
  return 0;
}
