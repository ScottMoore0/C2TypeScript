/* Array zero-init via `= {0}`. */
#include <stdio.h>
int main(void) {
  int xs[10] = {0};
  int sum = 0;
  for (int i = 0; i < 10; i++) sum += xs[i];
  printf("%d\n", sum);
  return 0;
}
