/* Struct field combo: nested_arr. */
#include <stdio.h>
struct S { int a[3]; };
int main(void) {
  struct S s = { {1, 2, 3} };
  printf("%d\n", s.a[0] + s.a[1] + s.a[2]);
  return 0;
}
