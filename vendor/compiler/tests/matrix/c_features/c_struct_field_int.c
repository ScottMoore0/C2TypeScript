/* Struct with single field of type int. */
#include <stdio.h>
struct S { int v; };
int main(void) {
  struct S s = { 12345 };
  printf("%d\n", s.v);
  return 0;
}
