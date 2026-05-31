/* Enum dirs pick NORTH. */
#include <stdio.h>
enum E_dirs { NORTH, SOUTH, EAST, WEST };
int main(void) {
  enum E_dirs x = NORTH;
  printf("%d\n", (int)x);
  return 0;
}
