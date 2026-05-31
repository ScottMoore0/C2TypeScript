/* C17 §6.5.15 — ternary selecting lvalue (write through). */
#include <stdio.h>
int main(void) {
  int a = 1, b = 2, *p;
  p = (a < b) ? &a : &b;
  *p = 99;
  printf("%d %d\n", a, b);
  return 0;
}
