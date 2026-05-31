/* C17 §6.5.9 — null-pointer comparison. */
#include <stdio.h>
#include <stdlib.h>
int main(void) {
  int *p = NULL;
  int x = 7;
  int *q = &x;
  printf("%d %d\n", p == NULL ? 1 : 0, q != NULL ? 1 : 0);
  return 0;
}
