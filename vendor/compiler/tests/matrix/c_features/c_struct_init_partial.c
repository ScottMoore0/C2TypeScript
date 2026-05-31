/* Partial struct init zero-fills remaining fields. */
#include <stdio.h>
struct S { int a; int b; int c; int d; };
int main(void) {
  struct S s = { 1, 2 };
  printf("%d %d %d %d\n", s.a, s.b, s.c, s.d);
  return 0;
}
