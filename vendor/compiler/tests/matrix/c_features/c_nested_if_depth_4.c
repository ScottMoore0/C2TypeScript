/* Nested if at depth 4. */
#include <stdio.h>
int main(void) {
  int x = 100;
  if (x > 10) {
    if (x > 20) {
      if (x > 30) {
        if (x > 40) {
          printf("deep_%d\n", x);
        }
      }
    }
  }
  return 0;
}
