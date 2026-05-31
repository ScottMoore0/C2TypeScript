/* Char array of size 8, fill with 'A' + i. */
#include <stdio.h>
int main(void) {
  char buf[8 + 1];
  for (int i = 0; i < 8; i++) buf[i] = (char)('a' + (i %% 26));
  buf[8] = 0;
  printf("%s\n", buf);
  return 0;
}
