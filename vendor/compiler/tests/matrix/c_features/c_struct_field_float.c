/* Struct with single field of type float. */
#include <stdio.h>
struct S { float v; };
int main(void) {
  struct S s = { 1.5f };
  printf("%.2f\n", s.v);
  return 0;
}
