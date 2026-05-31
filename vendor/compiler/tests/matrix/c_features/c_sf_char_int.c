/* Struct access: char_int. */
#include <stdio.h>
struct S { char c; int n; };
int main(void) {
  struct S s = { 'A', 42 };
  printf("%d\n", (int)s.c + s.n);
  return 0;
}
