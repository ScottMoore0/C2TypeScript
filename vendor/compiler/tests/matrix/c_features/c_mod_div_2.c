/* Modulo by 2 for inputs 0..15. */
#include <stdio.h>
int main(void) {
  for (int i = 0; i < 16; i++) printf("%d ", i %% 2);
  printf("\n");
  return 0;
}
