/* Struct field combo: abcd_int. */
#include <stdio.h>
struct S { int a; int b; int c; int d; };
int main(void) {
  struct S s = { 1, 2, 3, 4 };
  printf("%d\n", s.a + s.b + s.c + s.d);
  return 0;
}
