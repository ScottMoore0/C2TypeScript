/* Static array zero-init at file scope. */
#include <stdio.h>
static int g[10];
int main(void) {
  int sum = 0;
  for (int i = 0; i < 10; i++) sum += g[i];
  printf("%d\n", sum);
  return 0;
}
