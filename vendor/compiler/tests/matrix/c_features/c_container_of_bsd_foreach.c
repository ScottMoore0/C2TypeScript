/* BSD `<sys/queue.h>`-style LIST_FOREACH. Used by FreeBSD/OpenBSD
 * userspace, libevent's event list, Redis adlist (partial), and
 * countless small server codebases. The macro family relies on
 * pointer-to-pointer arithmetic that, in real <sys/queue.h>, also
 * uses container_of-style recovery internally.
 *
 * This test reproduces the LIST_* macro family in minimal form so
 * the bridge can be exercised without pulling in the platform header.
 */
#include <stdio.h>
#include <stddef.h>

#define LIST_HEAD(name, type) struct name { struct type *lh_first; }
#define LIST_ENTRY(type)      struct { struct type *le_next; struct type **le_prev; }
#define LIST_INIT(head)       do { (head)->lh_first = 0; } while (0)
#define LIST_INSERT_HEAD(head, elm, field) do {                     \
    if (((elm)->field.le_next = (head)->lh_first) != 0)              \
      (head)->lh_first->field.le_prev = &(elm)->field.le_next;       \
    (head)->lh_first = (elm);                                        \
    (elm)->field.le_prev = &(head)->lh_first;                        \
  } while (0)
#define LIST_FOREACH(var, head, field) \
  for ((var) = (head)->lh_first; (var) != 0; (var) = (var)->field.le_next)

struct item {
  int id;
  LIST_ENTRY(item) link;
};
LIST_HEAD(itemhead, item);

int main(void) {
  struct itemhead head;
  LIST_INIT(&head);
  struct item a = { 10, { 0, 0 } };
  struct item b = { 20, { 0, 0 } };
  struct item c = { 30, { 0, 0 } };
  LIST_INSERT_HEAD(&head, &c, link);
  LIST_INSERT_HEAD(&head, &b, link);
  LIST_INSERT_HEAD(&head, &a, link);

  int sum = 0;
  struct item *p;
  LIST_FOREACH(p, &head, link) sum += p->id;
  printf("sum=%d\n", sum); /* 60 */
  return 0;
}
