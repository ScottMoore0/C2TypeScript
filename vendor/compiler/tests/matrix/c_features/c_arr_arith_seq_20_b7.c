/* Sum arithmetic seq starting at 7, len 20. */
#include <stdio.h>
int main(void) {
  int a[20] = { 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26 };
  int s = 0;
  for (int i = 0; i < 20; i++) s += a[i];
  printf("%d\n", s);
  return 0;
}
