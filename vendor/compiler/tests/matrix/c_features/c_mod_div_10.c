/* Modulo by 10 for inputs 0..15. */
#include <stdio.h>
int main(void) {
  for (int i = 0; i < 16; i++) printf("%d ", i %% 10);
  printf("\n");
  return 0;
}
