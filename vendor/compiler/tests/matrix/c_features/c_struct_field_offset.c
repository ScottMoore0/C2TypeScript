/* offsetof — compute byte offsets. */
#include <stdio.h>
#include <stddef.h>
struct S { char a; int b; double c; char d; };
int main(void) {
  printf("%zu %zu %zu %zu\n",
    offsetof(struct S, a),
    offsetof(struct S, b),
    offsetof(struct S, c),
    offsetof(struct S, d));
  return 0;
}
