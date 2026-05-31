/* p + 5 on int[10]. */
#include <stdio.h>
int main(void) {
  int a[10] = { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };
  int *p = a + 5;
  printf("%d\n", *p);
  return 0;
}
