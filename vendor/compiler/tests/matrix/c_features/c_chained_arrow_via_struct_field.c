/* C17 §6.5.2.3 — chained arrow access where the inner step is a dot
 * MemberExpr yielding a CPtr. Lua's `top.p->val` and similar nested
 * patterns require the outer `->` to wrap with __struct_ptr_at so the
 * field resolves through the CPtr. Previously the emitter rejected
 * non-bare-name receivers and emitted a direct `.val` access that
 * fails when the receiver is a CPtr-shape value.
 */
#include <stdio.h>
#include <stdlib.h>

struct Inner { int x; int y; };

struct Holder {
  struct Inner *p;
  int tag;
};

int main(void) {
  struct Inner *raw = (struct Inner *)malloc(sizeof(struct Inner));
  raw->x = 7;
  raw->y = 13;

  struct Holder h;
  h.p = raw;
  h.tag = 99;

  /* Outer arrow on `h.p` — `h.p` is a MemberExpr (dot) returning
   * `struct Inner *`, then `->y` derefs and accesses y. */
  printf("x=%d y=%d tag=%d\n", h.p->x, h.p->y, h.tag);
  free(raw);
  return 0;
}
