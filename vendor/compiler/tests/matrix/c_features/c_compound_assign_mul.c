/* C17 §6.5.16.2 — compound assignment *=. */
#include <stdio.h>
int main(void) {
  int x = 1;
  x *= 2; x *= 3; x *= 5;
  printf("%d\n", x);
  return 0;
}
