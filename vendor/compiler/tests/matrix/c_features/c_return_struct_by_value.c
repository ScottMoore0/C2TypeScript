/* Function returning struct by value. */
#include <stdio.h>
struct Pair { int a, b; };
struct Pair make(int x) { struct Pair p = { x, x * 2 }; return p; }
int main(void) {
  struct Pair p = make(7);
  printf("%d %d\n", p.a, p.b);
  return 0;
}
