/* Pass struct by pointer (avoids copy). */
#include <stdio.h>
struct Big { int data[100]; int len; };
void fill(struct Big *b, int n) {
  b->len = n;
  for (int i = 0; i < n; i++) b->data[i] = i * 7;
}
int main(void) {
  struct Big b;
  fill(&b, 5);
  for (int i = 0; i < b.len; i++) printf("%d ", b.data[i]);
  printf("\n");
  return 0;
}
