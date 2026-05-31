/* Char array of size 128, fill with 'A' + i. */
#include <stdio.h>
int main(void) {
  char buf[128 + 1];
  for (int i = 0; i < 128; i++) buf[i] = (char)('a' + (i %% 26));
  buf[128] = 0;
  printf("%s\n", buf);
  return 0;
}
