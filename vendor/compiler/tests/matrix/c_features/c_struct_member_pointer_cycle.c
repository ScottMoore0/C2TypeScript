/* Doubly linked structure (head + tail). */
#include <stdio.h>
#include <stdlib.h>
struct N { int v; struct N *prev, *next; };
int main(void) {
  struct N a = { 1, NULL, NULL };
  struct N b = { 2, NULL, NULL };
  struct N c = { 3, NULL, NULL };
  a.next = &b; b.prev = &a; b.next = &c; c.prev = &b;
  for (struct N *p = &a; p; p = p->next) printf("%d ", p->v);
  for (struct N *p = &c; p; p = p->prev) printf("%d ", p->v);
  printf("\n");
  return 0;
}
