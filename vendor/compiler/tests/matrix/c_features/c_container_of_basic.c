/* C17 §6.5.3.2 p3 + §7.19 — container_of primitive, first-member case.
 *
 * The canonical form: given a pointer to a struct member, recover the
 * containing struct via byte arithmetic + cast. For the FIRST member,
 * offsetof() is 0; the cast is essentially identity but the spec rule
 * still has to round-trip cleanly.
 */
#include <stdio.h>
#include <stddef.h>

#define container_of(ptr, type, member) \
  ((type *)((char *)(ptr) - offsetof(type, member)))

struct T {
  int a;       /* first member */
  int b;
};

int main(void) {
  struct T t = { 11, 22 };
  int *pa = &t.a;
  struct T *recovered = container_of(pa, struct T, a);
  printf("a=%d b=%d same=%d\n", recovered->a, recovered->b, recovered == &t);
  return 0;
}
