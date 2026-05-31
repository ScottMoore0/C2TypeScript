/* C17 §6.3.2.3 p7 + §7.19 — inverse-container_of when the nested
 * member is at offset 0 (first member). Spec edge case: byte_offset
 * of 0 should still resolve to the field, not return the container
 * unchanged. Verifies that the bridge's offset-to-field lookup walks
 * the field list in declaration order.
 */
#include <stdio.h>
#include <stdlib.h>
#include <stddef.h>

struct Inner { int x; int y; };
struct Outer { struct Inner inner; int tail; };

int main(void) {
  struct Outer *o = (struct Outer *)malloc(sizeof(struct Outer));
  o->inner.x = 5;
  o->inner.y = 6;
  o->tail = 99;
  struct Inner *p = (struct Inner *)((char *)o + offsetof(struct Outer, inner));
  p->x = 50;
  p->y = 60;
  printf("x=%d y=%d tail=%d\n", o->inner.x, o->inner.y, o->tail);
  free(o);
  return 0;
}
