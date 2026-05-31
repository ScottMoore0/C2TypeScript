/* switch with 6 cases, fallthrough at 2. */
#include <stdio.h>
int main(void) {
  int y = 0;
  for (int x = 0; x < 6; x++) {
    switch (x) {
    case 0: y += 1;
      break;
    case 1: y += 2;
      break;
    case 2: y += 3;
    case 3: y += 4;
      break;
    case 4: y += 5;
      break;
    case 5: y += 6;
      break;
      default: break;
    }
  }
  printf("%d\n", y);
  return 0;
}
