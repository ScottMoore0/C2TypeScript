/* switch pattern: range_via_groups. */
#include <stdio.h>
int f(int x) {
  switch (x) {
    case 1: case 2: case 3: return 1;
    case 4: case 5: case 6: return 2;
    default: return 0;
  }
}
int main(void) {
  for (int i = 0; i < 8; i++) printf("%d ", f(i));
  printf("\n");
  return 0;
}
