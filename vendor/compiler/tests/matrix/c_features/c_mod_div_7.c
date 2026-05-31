/* Modulo by 7 for inputs 0..15. */
#include <stdio.h>
int main(void) {
  for (int i = 0; i < 16; i++) printf("%d ", i %% 7);
  printf("\n");
  return 0;
}
