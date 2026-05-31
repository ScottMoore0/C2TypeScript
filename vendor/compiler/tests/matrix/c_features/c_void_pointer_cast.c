/* void* round-trip cast — generic container pattern. */
#include <stdio.h>
int main(void) {
  int x = 42;
  void *p = &x;
  int *q = (int *)p;
  printf("%d\n", *q);
  return 0;
}
