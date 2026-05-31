/* switch pattern: simple. */
#include <stdio.h>
int f(int x) {
  switch (x) {
    case 0: return 100;
    case 1: return 200;
    case 2: return 300;
    default: return -1;
  }
}
int main(void) {
  for (int i = 0; i < 8; i++) printf("%d ", f(i));
  printf("\n");
  return 0;
}
