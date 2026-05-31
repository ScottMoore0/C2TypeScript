/* C17 §6.7.6.3 — function pointer whose signature returns a struct
 * BY VALUE. Forces the translator to materialise the struct return
 * value through the indirect call.
 */
#include <stdio.h>

struct Pair { int a; int b; };

struct Pair make_pair(int x) {
  struct Pair p = { x, x * 2 };
  return p;
}

int main(void) {
  struct Pair (*fp)(int) = make_pair;
  struct Pair r = fp(7);
  printf("a=%d b=%d\n", r.a, r.b);
  return 0;
}
