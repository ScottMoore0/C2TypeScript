/* Enum colors pick RED. */
#include <stdio.h>
enum E_colors { RED, GREEN, BLUE };
int main(void) {
  enum E_colors x = RED;
  printf("%d\n", (int)x);
  return 0;
}
