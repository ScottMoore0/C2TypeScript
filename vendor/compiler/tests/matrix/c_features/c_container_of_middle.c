/* C17 §7.19 — container_of on a non-first member.
 *
 * The interesting case for the bridge: offsetof returns a non-zero
 * byte delta, and the recovered pointer must equal the original
 * containing struct. This is the spec rule that the bridge runtime
 * has to honour: __byte_delta of -offsetof yields __owner.
 */
#include <stdio.h>
#include <stddef.h>

#define container_of(ptr, type, member) \
  ((type *)((char *)(ptr) - offsetof(type, member)))

struct T {
  int a;
  int b;       /* second member — non-zero offset */
  int c;
};

int main(void) {
  struct T t = { 1, 200, 3 };
  int *pb = &t.b;
  struct T *recovered = container_of(pb, struct T, b);
  printf("a=%d b=%d c=%d same=%d\n",
         recovered->a, recovered->b, recovered->c, recovered == &t);
  return 0;
}
