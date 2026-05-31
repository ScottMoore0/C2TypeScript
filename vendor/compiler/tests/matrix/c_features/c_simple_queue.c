/* Simple queue (FIFO). */
#include <stdio.h>
#define N 16
int q[N], head = 0, tail = 0;
void enq(int v) { q[tail++] = v; }
int deq(void) { return q[head++]; }
int main(void) {
  for (int i = 1; i <= 5; i++) enq(i * 10);
  while (head < tail) printf("%d ", deq());
  printf("\n");
  return 0;
}
