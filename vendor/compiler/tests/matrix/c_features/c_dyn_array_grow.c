/* Dynamic array grow via realloc. */
#include <stdio.h>
#include <stdlib.h>
int main(void) {
  int *a = NULL;
  int cap = 0, n = 0;
  for (int i = 0; i < 10; i++) {
    if (n == cap) { cap = cap ? cap * 2 : 4; a = realloc(a, cap * sizeof(int)); }
    a[n++] = i * i;
  }
  for (int i = 0; i < n; i++) printf("%d ", a[i]);
  printf("\n");
  free(a);
  return 0;
}
