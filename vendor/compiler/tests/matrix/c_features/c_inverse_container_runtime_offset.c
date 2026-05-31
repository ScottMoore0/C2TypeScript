/* C17 §6.3.2.3 p7 + §7.19 — inverse-container_of with offset stored
 * in a runtime variable (rather than offsetof literal).
 *
 * This is the uthash HH_FROM_ELMT pattern: the table caches `hho`
 * (offsetof of the hash handle within the entry) at runtime so the
 * macro `(UT_hash_handle*)((char*)elt + tbl->hho)` works generically
 * across element types. The bridge must handle the offset-as-variable
 * case identically to the offsetof-literal case.
 */
#include <stdio.h>
#include <stdlib.h>
#include <stddef.h>

struct Inner { int x; int y; };
struct Outer { int a; int b; struct Inner inner; };

int main(void) {
  struct Outer *o = (struct Outer *)malloc(sizeof(struct Outer));
  o->a = 1;
  o->b = 2;
  o->inner.x = 30;
  o->inner.y = 40;
  size_t off = offsetof(struct Outer, inner);
  struct Inner *p = (struct Inner *)((char *)o + off);
  p->x = 1000;
  p->y = 2000;
  printf("x=%d y=%d a=%d b=%d\n", o->inner.x, o->inner.y, o->a, o->b);
  free(o);
  return 0;
}
