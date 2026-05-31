/* C17 §6.7.2.1 + §6.3.2.3: a struct's first member shares the same address
 * as the struct itself. A pointer to the first member can be reinterpret-
 * cast to a pointer to the containing struct without offset adjustment.
 *
 * This is Lua's `nodefromval(o) = (Node *)(o)` pattern, where the lookup
 * returns `TValue *` (pointing at `Node.i_val`) and the caller casts up
 * to `Node *` to read the sibling `Key u` field.
 *
 *   struct Inner { int x; int y; };
 *   struct Outer { struct Inner first; long extra; };
 *
 *   Outer *o = ...;
 *   Inner *p = &o->first;            // points at the same bytes as o
 *   Outer *back = (Outer *)p;        // cast back: SAME byte address
 *   back->extra ... ;                // reads o.extra correctly
 *
 * If the translator drops the cast-back, accesses to `extra` on the recast
 * pointer fail (`.extra` doesn't exist on the Inner overlay).
 *
 * EXPECT: prints 100 (inner.x), 200 (inner.y), 9999 (outer.extra).
 */
#include <stdio.h>

typedef struct {
  int x;
  int y;
} Inner;

typedef struct {
  Inner first;
  long  extra;
} Outer;

int main(void) {
  Outer o = { { 100, 200 }, 9999 };
  /* Take a pointer to the first member only. */
  Inner *p = &o.first;
  printf("inner.x=%d\n", p->x);
  printf("inner.y=%d\n", p->y);
  /* Cast back to the containing struct — well-defined per §6.3.2.3 p7
   * because Inner is the first member of Outer. */
  Outer *back = (Outer *)p;
  printf("outer.extra=%ld\n", back->extra);
  return 0;
}
