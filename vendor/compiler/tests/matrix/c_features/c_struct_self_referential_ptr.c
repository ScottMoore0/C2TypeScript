/* C17 §6.7.2 — struct with self-referential pointer (linked list node). */
#include <stdio.h>
#include <stdlib.h>
struct Node {
  int value;
  struct Node *next;
};
int main(void) {
  struct Node a = { 1, NULL };
  struct Node b = { 2, &a };
  struct Node c = { 3, &b };
  for (struct Node *p = &c; p; p = p->next) printf("%d ", p->value);
  printf("\n");
  return 0;
}
