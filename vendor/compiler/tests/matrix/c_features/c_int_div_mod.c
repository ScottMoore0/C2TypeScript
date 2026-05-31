/* C17 §6.5.5 — integer division/modulo. */
#include <stdio.h>
int main(void) {
  printf("%d %d %d %d\n", 17 / 5, 17 % 5, -17 / 5, -17 % 5);
  return 0;
}
