/* Struct with single field of type short. */
#include <stdio.h>
struct S { short v; };
int main(void) {
  struct S s = { 100 };
  printf("%d\n", s.v);
  return 0;
}
