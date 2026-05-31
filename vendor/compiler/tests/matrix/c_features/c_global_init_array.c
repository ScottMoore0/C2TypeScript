/* Global array init at file scope. */
#include <stdio.h>
int g[5] = { 100, 200, 300, 400, 500 };
int main(void) {
  for (int i = 0; i < 5; i++) printf("%d ", g[i]);
  printf("\n");
  return 0;
}
