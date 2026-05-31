/* Pointer arithmetic on char[]. */
#include <stdio.h>
int main(void) {
  char arr[5] = { 1, 2, 3, 4, 5 };
  char *p = arr;
  char *q = arr + 4;
  printf("%d %d %d\n", (int)*p, (int)*q, (int)*(q - 2));
  return 0;
}
