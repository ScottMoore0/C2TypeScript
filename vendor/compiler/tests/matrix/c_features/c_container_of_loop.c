/* C17 §6.5.6 — container_of inside a loop iteration. The bridge must
 * recover the correct containing struct on each step; field pointers
 * can come from any node in a chain, and the recovery doesn't depend
 * on whether the iteration started at the head or somewhere in the
 * middle.
 *
 * This is the shape of intrusive linked-list traversal: walk the
 * embedded list_link nodes; on each step, recover the containing
 * entry via container_of and read the entry's payload.
 */
#include <stdio.h>
#include <stddef.h>

#define container_of(ptr, type, member) \
  ((type *)((char *)(ptr) - offsetof(type, member)))

struct list_link {
  struct list_link *next;
};

struct entry {
  int value;
  struct list_link link;
  int extra;
};

int main(void) {
  struct entry a = { 10, { 0 }, 0 };
  struct entry b = { 20, { 0 }, 0 };
  struct entry c = { 30, { 0 }, 0 };
  a.link.next = &b.link;
  b.link.next = &c.link;
  c.link.next = 0;

  int sum = 0;
  for (struct list_link *p = &a.link; p != 0; p = p->next) {
    struct entry *e = container_of(p, struct entry, link);
    sum += e->value;
  }
  printf("sum=%d\n", sum); /* 60 */
  return 0;
}
