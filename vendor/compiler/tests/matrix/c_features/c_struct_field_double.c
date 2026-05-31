/* Struct with single field of type double. */
#include <stdio.h>
struct S { double v; };
int main(void) {
  struct S s = { 3.14159 };
  printf("%.4f\n", s.v);
  return 0;
}
