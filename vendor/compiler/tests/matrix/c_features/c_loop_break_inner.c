/* C17 §6.8.6.3 — break exits innermost loop only. */
#include <stdio.h>
int main(void) {
  int outer = 0, inner = 0;
  for (int i = 0; i < 3; i++) {
    outer++;
    for (int j = 0; j < 5; j++) {
      if (j == 2) break;
      inner++;
    }
  }
  printf("outer=%d inner=%d\n", outer, inner);
  return 0;
}
