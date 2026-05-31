/* Calloc with check for null. */
#include <stdio.h>
#include <stdlib.h>
int main(void) {
  int *p = calloc(100, sizeof(int));
  int ok = (p != NULL);
  if (ok) {
    int sum = 0;
    for (int i = 0; i < 100; i++) sum += p[i];
    printf("ok=%d sum=%d\n", ok, sum);
    free(p);
  } else printf("fail\n");
  return 0;
}
