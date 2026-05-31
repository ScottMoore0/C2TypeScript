/* if-statement pattern: if_in_loop. */
#include <stdio.h>
int main(void) {
  int x = 7, y = 0;
  for (int i = 0; i < 10; i++) if (i > x) y++;
  printf("%d\n", y);
  return 0;
}
