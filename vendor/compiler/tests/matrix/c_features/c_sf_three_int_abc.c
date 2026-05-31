/* Struct access: three_int_abc. */
#include <stdio.h>
struct S { int a, b, c; };
int main(void) {
  struct S s = { 1, 10, 100 };
  printf("%d\n", s.a * s.c + s.b);
  return 0;
}
