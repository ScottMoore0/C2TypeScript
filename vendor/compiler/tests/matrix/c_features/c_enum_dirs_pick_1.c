/* Enum dirs pick SOUTH. */
#include <stdio.h>
enum E_dirs { NORTH, SOUTH, EAST, WEST };
int main(void) {
  enum E_dirs x = SOUTH;
  printf("%d\n", (int)x);
  return 0;
}
