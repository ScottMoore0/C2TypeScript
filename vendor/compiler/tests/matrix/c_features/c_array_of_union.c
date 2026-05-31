/* Array of union. */
#include <stdio.h>
union Cell { int i; double d; };
int main(void) {
  union Cell cells[3];
  cells[0].i = 42;
  cells[1].d = 3.14;
  cells[2].i = 99;
  printf("%d %.2f %d\n", cells[0].i, cells[1].d, cells[2].i);
  return 0;
}
