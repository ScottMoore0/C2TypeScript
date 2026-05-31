/* Char array of size 4, fill with 'A' + i. */
#include <stdio.h>
int main(void) {
  char buf[4 + 1];
  for (int i = 0; i < 4; i++) buf[i] = (char)('a' + (i %% 26));
  buf[4] = 0;
  printf("%s\n", buf);
  return 0;
}
