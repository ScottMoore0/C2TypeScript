/* Circular buffer of fixed capacity. */
#include <stdio.h>
#define CAP 4
struct CB { int data[CAP]; int head, tail, len; };
void put(struct CB *b, int v) {
  b->data[b->tail] = v;
  b->tail = (b->tail + 1) % CAP;
  if (b->len < CAP) b->len++;
  else b->head = (b->head + 1) % CAP;
}
int get(struct CB *b) {
  int v = b->data[b->head];
  b->head = (b->head + 1) % CAP;
  b->len--;
  return v;
}
int main(void) {
  struct CB b = {0};
  for (int i = 1; i <= 6; i++) put(&b, i);
  while (b.len) printf("%d ", get(&b));
  printf("\n");
  return 0;
}
