/* C17 §6.5.16.2 — compound assignment +=. */
#include <stdio.h>
int main(void) {
  int x = 10;
  x += 5; x += 3; x += -8;
  printf("%d\n", x);
  return 0;
}
