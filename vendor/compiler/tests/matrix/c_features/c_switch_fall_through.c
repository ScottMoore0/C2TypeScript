/* switch pattern: fall_through. */
#include <stdio.h>
int f(int x) {
  int r = 0;
  switch (x) {
    case 1: r += 1; /* fall through */
    case 2: r += 10; /* fall through */
    case 3: r += 100; break;
    default: r = -1;
  }
  return r;
}
int main(void) {
  for (int i = 0; i < 8; i++) printf("%d ", f(i));
  printf("\n");
  return 0;
}
