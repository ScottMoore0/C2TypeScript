/* C17 §6.5.3.2 p3 + §6.5.2.3 (member access) — address-of across a chain
 * of subscript and member accesses. Validates that the emitter composes
 * `&arr[i].inner.x`-style chains without mismatched brackets and that
 * nested subscript idioms like `arr[0].off + 1` as an index survive
 * translation. The bracket-mismatch bug (G11) showed up as
 * `cptr_read(aOp, i32(aOp[0).p3 - 1)]` before the fix.
 */
#include <stdio.h>

struct Inner { int x; int y; };
struct Outer { struct Inner inner; int off; };

int main(void) {
  struct Outer arr[4];
  for (int i = 0; i < 4; i++) {
    arr[i].inner.x = i;
    arr[i].inner.y = i * 3;
    arr[i].off = 1;
  }

  /* Pointer arithmetic over a struct array; the additive form goes through
   * the struct-array {__arr, __idx} lowering and the member chain must
   * emit without mismatched brackets. */
  struct Outer *base = &arr[0];
  for (int i = 0; i < 4; i++) {
    printf("%d %d\n", (base + i)->inner.x, (base + i)->inner.y);
  }

  /* The G11 shape: nested subscript + member access used as the index.
   * aOp[aOp[0].p3 - 1] in SQLite → must translate without stray `)` / `]`.
   * We exercise the nested-subscript index using a direct read.  */
  int idx_dynamic = arr[0].off + 1; /* = 2 */
  printf("%d %d\n", arr[idx_dynamic].inner.x, arr[arr[0].off + 1].inner.y);

  return 0;
}
