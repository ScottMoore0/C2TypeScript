/* C17 §6.5.3.1 — prefix ++/-- yield new value. */
#include <stdio.h>
int main(void) {
  int x = 5;
  int a = ++x;
  int b = --x;
  printf("%d %d %d\n", a, b, x);
  return 0;
}
