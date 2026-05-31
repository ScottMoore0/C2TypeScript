/* Pointer pattern: link_walk. */
#include <stdio.h>
int main(void) {
  struct N { int v; struct N *next; };
  struct N c = { 3, NULL };
  struct N b = { 2, &c };
  struct N a = { 1, &b };
  struct N *p = &a;
  while (p) { printf("%d ", p->v); p = p->next; }
  printf("\n");
  return 0;
}
