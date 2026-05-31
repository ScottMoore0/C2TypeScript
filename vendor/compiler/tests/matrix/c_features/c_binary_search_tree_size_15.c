/* Insert 15 values into BST and print in-order. */
#include <stdio.h>
#include <stdlib.h>
struct N { int v; struct N *l, *r; };
struct N *insert(struct N *root, int v) {
  if (!root) { struct N *n = malloc(sizeof *n); n->v = v; n->l = n->r = NULL; return n; }
  if (v < root->v) root->l = insert(root->l, v);
  else if (v > root->v) root->r = insert(root->r, v);
  return root;
}
void in_order(struct N *root) {
  if (!root) return;
  in_order(root->l);
  printf("%d ", root->v);
  in_order(root->r);
}
int main(void) {
  int seed = 12345;
  struct N *root = NULL;
  for (int i = 0; i < 15; i++) {
    seed = seed * 1103515245 + 12345;
    int v = (seed >> 16) %% 100;
    root = insert(root, v);
  }
  in_order(root);
  printf("\n");
  return 0;
}
