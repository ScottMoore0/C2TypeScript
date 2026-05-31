/* C17 §6.5.8/§6.5.9 — int comparison: < */
#include <stdio.h>
int main(void) {
  int a = 5, b = 7;
  printf("%d %d %d\n", (a < b) ? 1 : 0, (b < a) ? 1 : 0, (a < a) ? 1 : 0);
  return 0;
}
