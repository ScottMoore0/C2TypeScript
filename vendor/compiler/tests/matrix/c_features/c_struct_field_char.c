/* Struct with single field of type char. */
#include <stdio.h>
struct S { char v; };
int main(void) {
  struct S s = { 'A' };
  printf("%c\n", s.v);
  return 0;
}
