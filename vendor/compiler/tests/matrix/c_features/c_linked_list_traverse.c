/* Linked-list build and traverse. */
#include <stdio.h>
#include <stdlib.h>
struct N { int v; struct N *next; };
int main(void) {
  struct N *head = NULL;
  for (int i = 5; i >= 1; i--) {
    struct N *n = malloc(sizeof(struct N));
    n->v = i;
    n->next = head;
    head = n;
  }
  for (struct N *p = head; p; p = p->next) printf("%d ", p->v);
  printf("\n");
  while (head) { struct N *t = head; head = head->next; free(t); }
  return 0;
}
