/* Struct field combo: ab_long. */
#include <stdio.h>
struct S { long a; long b; };
int main(void) {
  struct S s = { 1000, 2000 };
  printf("%ld\n", s.a + s.b);
  return 0;
}
