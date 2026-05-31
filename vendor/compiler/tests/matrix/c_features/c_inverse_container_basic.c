/* C17 §6.3.2.3 p7 + §7.19 — inverse-container_of primitive.
 *
 * The dual of container_of: given a pointer to the containing struct
 * and the offset of a nested struct member, produce a pointer to the
 * nested struct via byte arithmetic + cast. Used by intrusive-list
 * libraries (uthash HH_FROM_ELMT, Linux hlist) to compute &t.member
 * from a runtime-stored offset.
 *
 * The bridge contract: writes through the resulting pointer must
 * propagate to the live nested struct on the original container.
 */
#include <stdio.h>
#include <stdlib.h>
#include <stddef.h>

struct Inner { int x; int y; };
struct Outer { int a; struct Inner inner; };

int main(void) {
  struct Outer *o = (struct Outer *)malloc(sizeof(struct Outer));
  o->a = 10;
  o->inner.x = 100;
  o->inner.y = 200;
  struct Inner *p = (struct Inner *)((char *)o + offsetof(struct Outer, inner));
  p->x = 999;
  p->y = 888;
  printf("a=%d x=%d y=%d\n", o->a, o->inner.x, o->inner.y);
  free(o);
  return 0;
}
