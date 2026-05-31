/* Char array of size 32, fill with 'A' + i. */
#include <stdio.h>
int main(void) {
  char buf[32 + 1];
  for (int i = 0; i < 32; i++) buf[i] = (char)('a' + (i %% 26));
  buf[32] = 0;
  printf("%s\n", buf);
  return 0;
}
