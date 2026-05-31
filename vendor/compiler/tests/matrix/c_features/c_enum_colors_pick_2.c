/* Enum colors pick BLUE. */
#include <stdio.h>
enum E_colors { RED, GREEN, BLUE };
int main(void) {
  enum E_colors x = BLUE;
  printf("%d\n", (int)x);
  return 0;
}
