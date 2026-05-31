/* Struct padding observations: size >= sum of fields. */
#include <stdio.h>
struct A { char c; int i; };
struct B { int i; char c; };
struct C { char a; char b; char c; };
int main(void) {
  printf("%zu %zu %zu\n", sizeof(struct A), sizeof(struct B), sizeof(struct C));
  return 0;
}
