/* C17 §6.3.2.3 p7 + §7.19 — inverse-container_of used in a linked
 * list relinking sequence (the uthash HASH_DELETE pattern).
 *
 * Each node embeds a Link. To relink a node, the algorithm needs
 * `&node->link` (the Link*) but only has the Node* and a runtime
 * offset. The inverse pattern computes Link* from Node* + offset.
 * Writes through the resulting Link* must update the live nested
 * Link inside the Node — otherwise relinking diverges and the list
 * loses connectivity.
 */
#include <stdio.h>
#include <stdlib.h>
#include <stddef.h>

struct Link { void *prev; void *next; };
struct Node { int id; struct Link link; };

int main(void) {
  struct Node *a = (struct Node *)malloc(sizeof(struct Node));
  struct Node *b = (struct Node *)malloc(sizeof(struct Node));
  a->id = 1;
  a->link.prev = 0;
  a->link.next = 0;
  b->id = 2;
  b->link.prev = 0;
  b->link.next = 0;
  size_t link_off = offsetof(struct Node, link);

  struct Link *la = (struct Link *)((char *)a + link_off);
  struct Link *lb = (struct Link *)((char *)b + link_off);
  la->next = b;
  lb->prev = a;

  printf("a.next.id=%d b.prev.id=%d\n",
         ((struct Node *)a->link.next)->id,
         ((struct Node *)b->link.prev)->id);
  free(a);
  free(b);
  return 0;
}
