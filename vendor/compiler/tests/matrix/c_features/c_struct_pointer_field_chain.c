/* Pointer-mediated field access chain via ->. */
#include <stdio.h>
struct A { int x; };
struct B { struct A *a; int y; };
int main(void) {
  struct A a = { 42 };
  struct B b = { &a, 7 };
  struct B *p = &b;
  printf("%d %d %d\n", p->a->x, p->y, b.a->x);
  return 0;
}
