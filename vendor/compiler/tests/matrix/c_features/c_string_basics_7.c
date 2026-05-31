/* String operation 7: building a 7-char string and measuring length. */
#include <stdio.h>
#include <string.h>
int main(void) {
  char buf[16];
  for (int i = 0; i < 7; i++) buf[i] = 'a' + i;
  buf[7] = 0;
  printf("%s len=%zu\n", buf, strlen(buf));
  return 0;
}
