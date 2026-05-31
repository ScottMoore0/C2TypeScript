/* C17 §6.5.8 + §6.7.8: pointer comparison (<, >, <=, >=) on TYPEDEF'd
 * pointer aliases. Mirrors Lua's StkId (= TValue *) comparison in luaF_close:
 *
 *   while (L->tbclist.p >= level) { ... }
 *
 * If the translator emits a raw JS `>=` between two CPtr objects (because
 * the qualType field shows the typedef name, not the underlying pointer
 * form), the comparison collapses to object→string coercion and always
 * returns the same answer — sentinel-loops never terminate (closeprotected
 * cascade, stack-walk while-loops).
 *
 * EXPECT: walks pointer cursor from end-of-array down past start sentinel,
 *         printing each cell, then stops.
 */
#include <stdio.h>

typedef int Cell;
typedef Cell *CellPtr;        /* the kind of typedef that matters */

int main(void) {
  Cell arr[5] = { 10, 20, 30, 40, 50 };
  CellPtr base = &arr[0];
  CellPtr top  = &arr[5];     /* one-past-end sentinel */
  /* Walk from top-1 down while cursor >= base. */
  int count = 0;
  for (CellPtr cur = top - 1; cur >= base; cur--) {
    printf("[%d] %d\n", count, *cur);
    count++;
    if (count > 10) { printf("RUNAWAY\n"); return 1; }
  }
  printf("count=%d\n", count);
  /* And the opposite direction: cur < top using typedef'd pointers. */
  for (CellPtr cur = base; cur < top; cur++) printf("fwd %d\n", *cur);
  return 0;
}
