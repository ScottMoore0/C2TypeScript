/* Enum dirs pick WEST. */
#include <stdio.h>
enum E_dirs { NORTH, SOUTH, EAST, WEST };
int main(void) {
  enum E_dirs x = WEST;
  printf("%d\n", (int)x);
  return 0;
}
