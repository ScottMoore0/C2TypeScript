/* Char array of size 64, fill with 'A' + i. */
#include <stdio.h>
int main(void) {
  char buf[64 + 1];
  for (int i = 0; i < 64; i++) buf[i] = (char)('a' + (i %% 26));
  buf[64] = 0;
  printf("%s\n", buf);
  return 0;
}
