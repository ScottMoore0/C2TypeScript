/* Struct field combo: ab_dbl. */
#include <stdio.h>
struct S { double a; double b; };
int main(void) {
  struct S s = { 1.5, 2.5 };
  printf("%.2f\n", s.a + s.b);
  return 0;
}
