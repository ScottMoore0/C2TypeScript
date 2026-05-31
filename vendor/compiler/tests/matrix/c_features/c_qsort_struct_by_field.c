/* qsort over array of struct by chosen field. */
#include <stdio.h>
#include <stdlib.h>
struct Item { const char *name; int prio; };
int by_prio(const void *a, const void *b) {
  const struct Item *ia = a, *ib = b;
  return ia->prio - ib->prio;
}
int main(void) {
  struct Item items[] = {
    { "c", 3 }, { "a", 1 }, { "b", 2 }, { "d", 0 }
  };
  qsort(items, 4, sizeof(items[0]), by_prio);
  for (int i = 0; i < 4; i++) printf("%s ", items[i].name);
  printf("\n");
  return 0;
}
