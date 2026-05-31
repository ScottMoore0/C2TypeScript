/* Function modifies through pointer arg. */
#include <stdio.h>
void inc(int *p) { (*p)++; }
int main(void) {
  int x = 5;
  inc(&x); inc(&x); inc(&x);
  printf("%d\n", x);
  return 0;
}
