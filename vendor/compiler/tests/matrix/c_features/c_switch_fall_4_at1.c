/* switch with 4 cases, fallthrough at 1. */
#include <stdio.h>
int main(void) {
  int y = 0;
  for (int x = 0; x < 4; x++) {
    switch (x) {
    case 0: y += 1;
      break;
    case 1: y += 2;
    case 2: y += 3;
      break;
    case 3: y += 4;
      break;
      default: break;
    }
  }
  printf("%d\n", y);
  return 0;
}
