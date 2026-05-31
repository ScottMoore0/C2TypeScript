/* Interaction: nested_struct. */
#include <stdio.h>

struct A { int v; };
struct B { struct A inner; int outer; };
int main(void) {
  struct B b = { { 7 }, 11 };
  printf("%d %d\n", b.inner.v, b.outer);
  return 0;
}

