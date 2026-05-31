/* Iterate array of struct, modify fields. */
#include <stdio.h>
struct Item { int v; int seen; };
int main(void) {
  struct Item items[5];
  for (int i = 0; i < 5; i++) { items[i].v = i * 7; items[i].seen = 0; }
  for (int i = 0; i < 5; i++) if (items[i].v % 2 == 0) items[i].seen = 1;
  for (int i = 0; i < 5; i++) printf("%d:%d ", items[i].v, items[i].seen);
  printf("\n");
  return 0;
}
