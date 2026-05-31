/* Char array of size 16, fill with 'A' + i. */
#include <stdio.h>
int main(void) {
  char buf[16 + 1];
  for (int i = 0; i < 16; i++) buf[i] = (char)('a' + (i %% 26));
  buf[16] = 0;
  printf("%s\n", buf);
  return 0;
}
