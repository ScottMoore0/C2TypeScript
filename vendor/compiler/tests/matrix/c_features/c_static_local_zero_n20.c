/* Static local var (count calls). */
#include <stdio.h>
int counter(int start) {
  static int n = 0;
  n += start;
  return n;
}
int main(void) {
  int last = 0;
  for (int i = 0; i < 20; i++) last = counter(1);
  printf("%d\n", last);
  return 0;
}
