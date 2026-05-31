/* C17 §6.7.9 — char array init from string literal includes null. */
#include <stdio.h>
int main(void) {
  char s[6] = "hello";
  printf("%s len=%d sentinel=%d\n", s, (int)sizeof(s), s[5]);
  return 0;
}
