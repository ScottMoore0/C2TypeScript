/* Sum arithmetic seq starting at 2, len 10. */
#include <stdio.h>
int main(void) {
  int a[10] = { 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 };
  int s = 0;
  for (int i = 0; i < 10; i++) s += a[i];
  printf("%d\n", s);
  return 0;
}
