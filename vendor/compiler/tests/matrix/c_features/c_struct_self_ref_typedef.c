/* C17 §6.7 — struct typedef with self-referential pointer. */
#include <stdio.h>
typedef struct N { int v; struct N *next; } N;
int main(void) {
  N a = { 1, NULL };
  N b = { 2, &a };
  printf("%d %d\n", b.v, b.next->v);
  return 0;
}
