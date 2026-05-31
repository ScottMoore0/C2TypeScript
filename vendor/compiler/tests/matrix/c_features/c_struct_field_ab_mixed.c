/* Struct field combo: ab_mixed. */
#include <stdio.h>
struct S { int a; double b; };
int main(void) {
  struct S s = { 3, 2.5 };
  printf("%.2f\n", s.a + s.b);
  return 0;
}
