/* Struct zero-init via `= {0}`. */
#include <stdio.h>
struct S { int a; double b; char c[10]; };
int main(void) {
  struct S s = {0};
  printf("%d %.1f %d\n", s.a, s.b, (int)s.c[0]);
  return 0;
}
