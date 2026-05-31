/* Enum colors pick GREEN. */
#include <stdio.h>
enum E_colors { RED, GREEN, BLUE };
int main(void) {
  enum E_colors x = GREEN;
  printf("%d\n", (int)x);
  return 0;
}
