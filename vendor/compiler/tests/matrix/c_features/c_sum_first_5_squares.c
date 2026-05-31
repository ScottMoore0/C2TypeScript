/* Sum of first 5 squares: n*(n+1)*(2n+1)/6 */
#include <stdio.h>
int main(void) {
  int s = 0;
  for (int i = 1; i <= 5; i++) s += i * i;
  printf("%d\n", s);
  return 0;
}
