/* Interaction: nested_struct_ptr. */
#include <stdio.h>

struct A { int v; };
struct B { struct A *inner; };
int main(void) {
  struct A a = { 42 };
  struct B b = { &a };
  printf("%d\n", b.inner->v);
  return 0;
}

