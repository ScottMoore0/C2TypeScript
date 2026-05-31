/* Whole-struct assignment. */
#include <stdio.h>
struct S { int a, b, c; };
int main(void) {
  struct S s1 = { 1, 2, 3 };
  struct S s2;
  s2 = s1;
  s1.a = 99;
  printf("%d %d %d / %d %d %d\n", s1.a, s1.b, s1.c, s2.a, s2.b, s2.c);
  return 0;
}
