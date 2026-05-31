/* Struct with single field of type long long. */
#include <stdio.h>
struct S { long long v; };
int main(void) {
  struct S s = { 1234567890LL };
  printf("%lld\n", s.v);
  return 0;
}
