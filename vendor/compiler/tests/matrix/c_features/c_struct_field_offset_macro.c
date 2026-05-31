/* offsetof — basic. */
#include <stdio.h>
#include <stddef.h>
struct S { char a; int b; double c; };
int main(void) {
  printf("%zu %zu %zu\n",
    offsetof(struct S, a),
    offsetof(struct S, b),
    offsetof(struct S, c));
  return 0;
}
