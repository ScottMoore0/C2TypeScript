/* Interaction: multi_return. */
#include <stdio.h>

struct R { int a; int b; int c; };
struct R triple(int n) { struct R r = { n, n*2, n*3 }; return r; }
int main(void) {
  struct R r = triple(7);
  printf("%d %d %d\n", r.a, r.b, r.c);
  return 0;
}

