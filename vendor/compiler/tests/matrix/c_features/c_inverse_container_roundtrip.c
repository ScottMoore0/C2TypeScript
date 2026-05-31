/* C17 §6.3.2.3 p7 + §7.19 — inverse-container_of composed with
 * container_of for a complete round-trip.
 *
 * Compose `(F*)((char*)t + offsetof(T,f))` with
 * `(T*)((char*)f - offsetof(T,f))` and verify the original
 * container is recovered. This exercises both bridge directions
 * back-to-back: forward (inverse-container_of) followed by reverse
 * (container_of).
 */
#include <stdio.h>
#include <stdlib.h>
#include <stddef.h>

struct Inner { int x; };
struct Outer { int a; struct Inner inner; int b; };

int main(void) {
  struct Outer *o = (struct Outer *)malloc(sizeof(struct Outer));
  o->a = 7;
  o->inner.x = 42;
  o->b = 8;
  struct Inner *p = (struct Inner *)((char *)o + offsetof(struct Outer, inner));
  struct Outer *recovered = (struct Outer *)((char *)p - offsetof(struct Outer, inner));
  printf("a=%d x=%d b=%d same=%d\n",
         recovered->a, recovered->inner.x, recovered->b, recovered == o);
  free(o);
  return 0;
}
