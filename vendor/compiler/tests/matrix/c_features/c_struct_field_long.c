/* Struct with single field of type long. */
#include <stdio.h>
struct S { long v; };
int main(void) {
  struct S s = { 1234567890L };
  printf("%ld\n", s.v);
  return 0;
}
