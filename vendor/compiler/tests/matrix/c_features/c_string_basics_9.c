/* String operation 9: building a 9-char string and measuring length. */
#include <stdio.h>
#include <string.h>
int main(void) {
  char buf[16];
  for (int i = 0; i < 9; i++) buf[i] = 'a' + i;
  buf[9] = 0;
  printf("%s len=%zu\n", buf, strlen(buf));
  return 0;
}
