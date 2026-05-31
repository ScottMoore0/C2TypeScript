/* Struct field combo: ab_int. */
#include <stdio.h>
struct S { int a; int b; };
int main(void) {
  struct S s = { 5, 10 };
  printf("%d\n", s.a + s.b);
  return 0;
}
