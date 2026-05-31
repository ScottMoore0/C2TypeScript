/* C17 §7.24.3.2 — strncat. */
#include <stdio.h>
#include <string.h>
int main(void) {
  char buf[32] = "hello";
  strncat(buf, ", world!!", 7);
  printf("%s\n", buf);
  return 0;
}
