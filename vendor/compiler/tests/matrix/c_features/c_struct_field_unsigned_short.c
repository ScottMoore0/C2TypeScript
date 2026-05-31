/* Struct with single field of type unsigned short. */
#include <stdio.h>
struct S { unsigned short v; };
int main(void) {
  struct S s = { 65535 };
  printf("%u\n", s.v);
  return 0;
}
