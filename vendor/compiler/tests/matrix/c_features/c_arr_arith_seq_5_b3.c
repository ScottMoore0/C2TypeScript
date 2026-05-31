/* Sum arithmetic seq starting at 3, len 5. */
#include <stdio.h>
int main(void) {
  int a[5] = { 3, 4, 5, 6, 7 };
  int s = 0;
  for (int i = 0; i < 5; i++) s += a[i];
  printf("%d\n", s);
  return 0;
}
