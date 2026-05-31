/* Continue in outer loop only. */
#include <stdio.h>
int main(void) {
  int sum = 0;
  for (int i = 0; i < 5; i++) {
    if (i == 2) continue;
    for (int j = 0; j < 3; j++) sum += i * j;
  }
  printf("%d\n", sum);
  return 0;
}
