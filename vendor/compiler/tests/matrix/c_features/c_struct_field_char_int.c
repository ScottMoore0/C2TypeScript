/* Struct field combo: char_int. */
#include <stdio.h>
struct S { char c; int n; };
int main(void) {
  struct S s = { 'X', 100 };
  printf("%d\n", (int)s.c + s.n);
  return 0;
}
