/* Function pointer with 0 arguments. */
#include <stdio.h>
int sum_0(void) { return 0; }
int main(void) {
  int (*fp)(void) = sum_0;
  printf("%d\n", fp());
  return 0;
}
