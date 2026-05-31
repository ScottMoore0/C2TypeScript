/* C17 §6.5.3.2 + §6.5.2.1 + §6.5.2.3 — `(&arr[i])->field` arrow access
 * on the address of an array subscript. Equivalent to `arr[i].field`
 * but the explicit `&...->` form requires the emitter to wrap the
 * address-of-subscript receiver with `__struct_ptr_at` so the cursor
 * shape produced by the array-pointer-arithmetic lowering correctly
 * resolves to the underlying struct instance. Lua's `setempty(&t->
 * array[i])` after a table resize is the canonical case.
 */
#include <stdio.h>
#include <stdlib.h>

struct Cell { int kind; int payload; };

int main(void) {
  struct Cell *cells = (struct Cell *)malloc(sizeof(struct Cell) * 3);
  for (int i = 0; i < 3; i++) {
    (&cells[i])->kind = i + 100;
    (&cells[i])->payload = i * 10;
  }
  printf("%d %d %d / %d %d %d\n",
         cells[0].kind, cells[1].kind, cells[2].kind,
         cells[0].payload, cells[1].payload, cells[2].payload);
  free(cells);
  return 0;
}
