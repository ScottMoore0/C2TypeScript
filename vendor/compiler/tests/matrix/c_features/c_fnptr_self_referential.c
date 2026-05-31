/* C17 §6.7.2 + §6.7.6.3 — node containing a handler function pointer
 * that takes the node by pointer (self-referential through the
 * struct's tag). Common in tree-walker visitors, AST visitors, and
 * doubly-linked-list traversal callbacks.
 */
#include <stdio.h>
#include <stdlib.h>

struct Node {
  int value;
  void (*visit)(struct Node *self);
  struct Node *next;
};

int g_total = 0;
void accumulate(struct Node *self) { g_total += self->value; }

int main(void) {
  struct Node *a = (struct Node *)malloc(sizeof(struct Node));
  struct Node *b = (struct Node *)malloc(sizeof(struct Node));
  struct Node *c = (struct Node *)malloc(sizeof(struct Node));
  a->value = 1; a->visit = accumulate; a->next = b;
  b->value = 2; b->visit = accumulate; b->next = c;
  c->value = 3; c->visit = accumulate; c->next = 0;

  for (struct Node *p = a; p; p = p->next) p->visit(p);
  printf("total=%d\n", g_total);
  free(a); free(b); free(c);
  return 0;
}
