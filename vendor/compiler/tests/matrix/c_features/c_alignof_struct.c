/* C17 §6.5.3.4 — _Alignof on struct. */
#include <stdio.h>
#include <stdalign.h>
struct A { char c; double d; };
int main(void) {
  printf("%zu %zu\n", _Alignof(struct A), _Alignof(double));
  return 0;
}
