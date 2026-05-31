/* Struct with single field of type unsigned char. */
#include <stdio.h>
struct S { unsigned char v; };
int main(void) {
  struct S s = { 255 };
  printf("%u\n", s.v);
  return 0;
}
