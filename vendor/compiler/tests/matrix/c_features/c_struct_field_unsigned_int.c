/* Struct with single field of type unsigned int. */
#include <stdio.h>
struct S { unsigned int v; };
int main(void) {
  struct S s = { 4294967295u };
  printf("%u\n", s.v);
  return 0;
}
