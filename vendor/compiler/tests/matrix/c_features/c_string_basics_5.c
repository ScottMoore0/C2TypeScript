/* String operation 5: building a 5-char string and measuring length. */
#include <stdio.h>
#include <string.h>
int main(void) {
  char buf[16];
  for (int i = 0; i < 5; i++) buf[i] = 'a' + i;
  buf[5] = 0;
  printf("%s len=%zu\n", buf, strlen(buf));
  return 0;
}
