/* Sum arithmetic seq starting at 13, len 30. */
#include <stdio.h>
int main(void) {
  int a[30] = { 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42 };
  int s = 0;
  for (int i = 0; i < 30; i++) s += a[i];
  printf("%d\n", s);
  return 0;
}
