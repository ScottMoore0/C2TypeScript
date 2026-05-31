/* Sum arithmetic seq starting at 5, len 15. */
#include <stdio.h>
int main(void) {
  int a[15] = { 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19 };
  int s = 0;
  for (int i = 0; i < 15; i++) s += a[i];
  printf("%d\n", s);
  return 0;
}
